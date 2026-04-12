import { FastifyInstance } from "fastify";
import { users, sessions, tenants, learners } from "@aivo/db";
import { signJWT, verifyJWT } from "@aivo/security";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import argon2 from "argon2";

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "password", "name", "role"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string", minLength: 1 },
          role: { type: "string", enum: ["PARENT"] },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password, name, role } = req.body as any;
    const db = (app as any).db;

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const [tenant] = await db.insert(tenants).values({
      name: `${name}'s Family`,
      type: "B2C_FAMILY",
    }).returning();

    const [user] = await db.insert(users).values({
      tenantId: tenant.id,
      email,
      passwordHash: await hashPassword(password),
      name,
      role,
    }).returning();

    const accessToken = await signJWT({
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email!,
      name: user.name,
    });

    const rawRefreshToken = crypto.randomUUID();
    await db.insert(sessions).values({
      userId: user.id,
      refreshToken: hashRefreshToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    reply.setCookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: tenant.id },
      accessToken,
    };
  });

  app.post("/api/auth/login", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const { email, password } = req.body as any;
    const db = (app as any).db;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const accessToken = await signJWT({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email!,
      name: user.name,
    });

    const rawRefreshToken = crypto.randomUUID();
    await db.insert(sessions).values({
      userId: user.id,
      refreshToken: hashRefreshToken(rawRefreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    reply.setCookie("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
      accessToken,
    };
  });

  app.post("/api/auth/pin-login", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["parentId", "pin"],
        properties: {
          parentId: { type: "string" },
          pin: { type: "string", minLength: 4, maxLength: 6 },
        },
      },
    },
  }, async (req, reply) => {
    const { parentId, pin } = req.body as any;
    const db = (app as any).db;

    const [parent] = await db.select().from(users)
      .where(and(eq(users.id, parentId), eq(users.role, "PARENT")))
      .limit(1);

    if (!parent) {
      return reply.status(401).send({ error: "Invalid parent ID" });
    }

    const learnerList = await db.select().from(learners)
      .where(eq(learners.parentId, parentId));
    const learnerUserIds = learnerList.map((l: any) => l.userId);

    if (learnerUserIds.length === 0) {
      return reply.status(401).send({ error: "No learners found" });
    }

    const allLearnerUsers = await db.select().from(users)
      .where(and(eq(users.role, "LEARNER"), eq(users.pin, pin)));
    const matchedLearner = allLearnerUsers.find((u: any) => learnerUserIds.includes(u.id));

    if (!matchedLearner) {
      return reply.status(401).send({ error: "Invalid PIN" });
    }

    const accessToken = await signJWT({
      sub: matchedLearner.id,
      tenantId: matchedLearner.tenantId,
      role: "LEARNER",
      name: matchedLearner.name,
    }, "2h");

    return {
      user: { id: matchedLearner.id, name: matchedLearner.name, role: "LEARNER", tenantId: matchedLearner.tenantId },
      accessToken,
    };
  });

  app.post("/api/auth/refresh", {
    schema: { tags: ["Auth"] },
  }, async (req, reply) => {
    const token = req.cookies.refreshToken;
    if (!token) return reply.status(401).send({ error: "No refresh token" });

    const db = (app as any).db;
    const hashedToken = hashRefreshToken(token);
    const [session] = await db.select().from(sessions)
      .where(eq(sessions.refreshToken, hashedToken))
      .limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return reply.status(401).send({ error: "Invalid or expired refresh token" });
    }

    const [user] = await db.select().from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) return reply.status(401).send({ error: "User not found" });

    const accessToken = await signJWT({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email || undefined,
      name: user.name,
    });

    return { accessToken };
  });

  app.post("/api/auth/logout", {
    schema: { tags: ["Auth"] },
  }, async (req, reply) => {
    const token = req.cookies.refreshToken;
    if (token) {
      const db = (app as any).db;
      await db.delete(sessions).where(eq(sessions.refreshToken, hashRefreshToken(token)));
    }
    reply.clearCookie("refreshToken", { path: "/" });
    return { success: true };
  });
}
