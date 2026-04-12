import { FastifyInstance } from "fastify";
import { users, sessions, tenants, learners } from "@aivo/db";
import { signJWT, verifyJWT } from "@aivo/security";
import { eq, and, sql } from "drizzle-orm";
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

async function deleteLearnerCascade(db: any, learnerId: string) {
  const dependentTables = [
    "assessment_attempts",
    "avatar_inventory",
    "badges",
    "brain_insights",
    "brain_recommendations",
    "brain_state_snapshots",
    "brain_states",
    "break_activities",
    "causal_analyses",
    "challenge_participants",
    "collaboration_invites",
    "currency_transactions",
    "functional_milestones",
    "gradebook_entries",
    "homework_sessions",
    "homework_assignments",
    "iep_documents",
    "iep_goals",
    "iep_profiles",
    "language_profiles",
    "leaderboard_entries",
    "learner_caregivers",
    "learner_functioning_levels",
    "learner_teachers",
    "learner_therapists",
    "learning_paths",
    "lesson_plans",
    "lesson_sessions",
    "parent_assessments",
    "parent_reported_events",
    "quest_progress",
    "sel_checkins",
    "sensory_profiles",
    "streaks",
    "therapy_goals",
    "therapy_sessions",
    "transition_plans",
    "tutor_sessions",
    "virtual_currency",
    "xp_events",
  ];

  for (const t of dependentTables) {
    await db.execute(sql.raw(`DELETE FROM "${t}" WHERE learner_id = '${learnerId}'`));
  }
  await db.execute(sql.raw(`DELETE FROM "learners" WHERE id = '${learnerId}'`));
}

async function deleteUserCascade(db: any, userId: string) {
  await db.execute(sql.raw(`DELETE FROM "consent_records" WHERE parent_id = '${userId}' OR child_id = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "collaboration_invites" WHERE invited_by = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "learner_caregivers" WHERE caregiver_user_id = '${userId}' OR invited_by = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "learner_teachers" WHERE teacher_user_id = '${userId}' OR invited_by = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "learner_therapists" WHERE therapist_user_id = '${userId}' OR invited_by = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "lesson_plans" WHERE teacher_user_id = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "audit_events" WHERE user_id = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "subscriptions" WHERE user_id = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "tutor_subscriptions" WHERE user_id = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "sessions" WHERE user_id = '${userId}'`));
  await db.execute(sql.raw(`DELETE FROM "users" WHERE id = '${userId}'`));
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get("/api/auth/public-key", async (_req, reply) => {
    const { getPublicKeyPEM } = await import("@aivo/security");
    const pem = await getPublicKeyPEM();
    if (!pem) {
      return reply.status(503).send({ error: "Keys not initialized" });
    }
    return { publicKey: pem, algorithm: "RS256" };
  });

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

    const isEmail = parentId.includes("@");
    let parent;
    if (isEmail) {
      const [found] = await db.select().from(users)
        .where(and(eq(users.email, parentId), eq(users.role, "PARENT")))
        .limit(1);
      parent = found;
    } else {
      const [found] = await db.select().from(users)
        .where(and(eq(users.id, parentId), eq(users.role, "PARENT")))
        .limit(1);
      parent = found;
    }

    if (!parent) {
      return reply.status(401).send({ error: "Invalid parent email or ID" });
    }

    const learnerList = await db.select().from(learners)
      .where(eq(learners.parentId, parent.id));
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

  app.put("/api/auth/password", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8 },
        },
      },
    },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Missing authorization" });

    let payload: any;
    try { payload = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }

    const db = (app as any).db;
    const { currentPassword, newPassword } = req.body as any;

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || !user.passwordHash) return reply.status(404).send({ error: "User not found" });

    const valid = await verifyPassword(user.passwordHash, currentPassword);
    if (!valid) return reply.status(400).send({ error: "Current password is incorrect" });

    await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, payload.sub));
    await db.delete(sessions).where(eq(sessions.userId, payload.sub));
    return { success: true };
  });

  app.put("/api/auth/profile", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
        },
      },
    },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Missing authorization" });

    let payload: any;
    try { payload = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }

    const db = (app as any).db;
    const { name, email } = req.body as any;
    const updates: any = {};
    if (name) updates.name = name;
    if (email) {
      const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing && existing.id !== payload.sub) return reply.status(409).send({ error: "Email already in use" });
      updates.email = email;
    }

    if (Object.keys(updates).length === 0) return reply.status(400).send({ error: "No fields to update" });

    await db.update(users).set(updates).where(eq(users.id, payload.sub));
    const [updated] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    return { user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } };
  });

  app.delete("/api/auth/account", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["password"],
        properties: {
          password: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Missing authorization" });

    let payload: any;
    try { payload = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }

    const db = (app as any).db;
    const { password } = req.body as any;

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || !user.passwordHash) return reply.status(404).send({ error: "User not found" });

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) return reply.status(400).send({ error: "Incorrect password" });

    const userLearners = await db.select().from(learners).where(eq(learners.parentId, payload.sub));
    for (const l of userLearners) {
      await deleteLearnerCascade(db, l.id);
      if (l.userId) {
        await deleteUserCascade(db, l.userId);
      }
    }
    await deleteUserCascade(db, payload.sub);

    reply.clearCookie("refreshToken", { path: "/" });
    return { success: true, deleted: true };
  });

  app.delete("/api/auth/learner/:learnerId", {
    schema: { tags: ["Auth"] },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Missing authorization" });

    let payload: any;
    try { payload = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }

    const db = (app as any).db;
    const { learnerId } = req.params as any;

    const [learner] = await db.select().from(learners).where(eq(learners.id, learnerId)).limit(1);
    if (!learner) return reply.status(404).send({ error: "Learner not found" });
    if (learner.parentId !== payload.sub) return reply.status(403).send({ error: "You can only delete your own learners" });

    try {
      await deleteLearnerCascade(db, learnerId);
      if (learner.userId) {
        await deleteUserCascade(db, learner.userId);
      }
    } catch (err: any) {
      app.log.error({ err: err.message, learnerId }, "Failed to delete learner");
      return reply.status(500).send({ error: "Failed to delete learner", detail: err.message });
    }

    return { success: true, deletedLearnerId: learnerId };
  });
}
