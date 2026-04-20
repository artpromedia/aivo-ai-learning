import { FastifyInstance } from "fastify";
import { users, sessions, tenants, learners, mfaCodes, passwordResetTokens } from "@aivo/db";
import { signJWT, verifyJWT } from "@aivo/security";
import { eq, and, sql, lt } from "drizzle-orm";
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

async function verifyGoogleToken(idToken: string): Promise<{ email: string; name: string; googleId: string } | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) return null;
    const payload = await response.json() as {
      aud?: string; iss?: string; email?: string; email_verified?: string;
      exp?: string; name?: string; sub?: string;
    };
    if (payload.aud !== clientId) return null;
    if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") return null;
    if (!payload.email || payload.email_verified !== "true") return null;
    if (payload.exp && Number(payload.exp) * 1000 < Date.now()) return null;
    return {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      googleId: payload.sub || "",
    };
  } catch {
    return null;
  }
}

const COMMS_URL = process.env.COMMS_SVC_URL || process.env.COMMS_SERVICE_URL || "http://localhost:3003";
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");

function generateMfaCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

async function createAndSendMfaCode(db: any, userId: string, email: string, name: string, purpose = "login"): Promise<string> {
  await db.update(mfaCodes).set({ used: true, usedAt: new Date() }).where(and(eq(mfaCodes.userId, userId), eq(mfaCodes.used, false)));

  const code = generateMfaCode();
  const [mfaRecord] = await db.insert(mfaCodes).values({
    userId,
    code,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  }).returning();

  const commsRes = await fetch(`${COMMS_URL}/api/comms/internal/mfa-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-key": INTERNAL_KEY },
    body: JSON.stringify({ to: email, code, name }),
  }).catch(() => null);

  if (!commsRes || !commsRes.ok) {
    throw new Error("Failed to send MFA code email");
  }

  return mfaRecord.id;
}

async function signMfaToken(userId: string, email: string): Promise<string> {
  return signJWT({ sub: userId, tenantId: "", role: "", email, purpose: "mfa" } as any, "15m");
}

const MFA_FORCED_ROLES = ["PLATFORM_ADMIN", "DISTRICT_ADMIN", "SALES", "MARKETING", "CUSTOMER_CARE", "SUPPORT", "FINANCE", "DEVOPS"];

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

    if (user.deactivatedAt) {
      return reply.status(403).send({ error: "Account has been deactivated. Contact support." });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const mfaRequired = user.mfaEnabled || MFA_FORCED_ROLES.includes(user.role);
    if (mfaRequired) {
      if (!user.mfaEnabled && MFA_FORCED_ROLES.includes(user.role)) {
        await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, user.id));
      }
      try {
        await createAndSendMfaCode(db, user.id, user.email!, user.name);
      } catch {
        return reply.status(502).send({ error: "Failed to send verification code. Please try again." });
      }
      const mfaToken = await signMfaToken(user.id, user.email!);
      return { mfaPending: true, mfaToken, mfaMethod: "email" };
    }

    const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || null;
    await db.update(users).set({
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
    }).where(eq(users.id, user.id));

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

  const ADMIN_ROLES = ["PLATFORM_ADMIN", "DISTRICT_ADMIN", "SALES", "MARKETING", "CUSTOMER_CARE", "SUPPORT", "FINANCE", "DEVOPS"];

  app.post("/api/auth/admin-login", {
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

    const genericError = "Invalid credentials";

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: genericError });
    }

    const validPw = await verifyPassword(user.passwordHash, password);
    if (!validPw) {
      return reply.status(401).send({ error: genericError });
    }

    if (!ADMIN_ROLES.includes(user.role)) {
      return reply.status(401).send({ error: genericError });
    }

    if (user.deactivatedAt) {
      return reply.status(401).send({ error: genericError });
    }

    if (user.mfaEnabled || MFA_FORCED_ROLES.includes(user.role)) {
      if (!user.mfaEnabled) {
        await db.update(users).set({ mfaEnabled: true, mfaMethod: "email" }).where(eq(users.id, user.id));
      }
      try {
        await createAndSendMfaCode(db, user.id, user.email!, user.name);
      } catch {
        return reply.status(502).send({ error: "Failed to send verification code. Please try again." });
      }
      const mfaToken = await signMfaToken(user.id, user.email!);
      return { mfaPending: true, mfaToken, mfaMethod: "email" };
    }

    const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || null;
    await db.update(users).set({
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
    }).where(eq(users.id, user.id));

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

  app.post("/api/auth/google", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["idToken"],
        properties: {
          idToken: { type: "string" },
          coppaConsent: { type: "boolean" },
          termsAccepted: { type: "boolean" },
        },
      },
    },
  }, async (req, reply) => {
    const { idToken, coppaConsent, termsAccepted } = req.body as any;
    const db = (app as any).db;

    const googleUser = await verifyGoogleToken(idToken);
    if (!googleUser) {
      return reply.status(401).send({ error: "Invalid Google token" });
    }

    const [existingByGoogleId] = await db.select().from(users)
      .where(eq(users.googleId, googleUser.googleId)).limit(1);

    let user;
    if (existingByGoogleId) {
      user = existingByGoogleId;
    } else {
      const [existingByEmail] = await db.select().from(users)
        .where(eq(users.email, googleUser.email)).limit(1);

      if (existingByEmail) {
        if (existingByEmail.googleId && existingByEmail.googleId !== googleUser.googleId) {
          return reply.status(409).send({ error: "This email is already linked to a different Google account" });
        }
        if (!existingByEmail.googleId) {
          await db.update(users)
            .set({ googleId: googleUser.googleId })
            .where(eq(users.id, existingByEmail.id));
        }
        user = { ...existingByEmail, googleId: googleUser.googleId };
      } else {
        if (!coppaConsent || !termsAccepted) {
          return reply.status(400).send({ error: "COPPA consent and terms acceptance required for new accounts", requiresConsent: true });
        }

        const [tenant] = await db.insert(tenants).values({
          name: `${googleUser.name}'s Family`,
          type: "B2C_FAMILY",
        }).returning();

        const [newUser] = await db.insert(users).values({
          tenantId: tenant.id,
          email: googleUser.email,
          name: googleUser.name,
          role: "PARENT",
          googleId: googleUser.googleId,
        }).returning();
        user = newUser;
      }
    }

    const googleMfaRequired = user.mfaEnabled || MFA_FORCED_ROLES.includes(user.role);
    if (googleMfaRequired && user.email) {
      if (!user.mfaEnabled && MFA_FORCED_ROLES.includes(user.role)) {
        await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, user.id));
      }
      try {
        await createAndSendMfaCode(db, user.id, user.email, user.name);
      } catch {
        return reply.status(502).send({ error: "Failed to send verification code. Please try again." });
      }
      const mfaToken = await signMfaToken(user.id, user.email);
      return { mfaPending: true, mfaToken, mfaMethod: "email" };
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

    if (user.deactivatedAt) {
      await db.delete(sessions).where(eq(sessions.userId, user.id));
      reply.clearCookie("refreshToken", { path: "/" });
      return reply.status(401).send({ error: "Account has been deactivated" });
    }

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

  app.post("/api/auth/forgot-password", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
    },
  }, async (request, reply) => {
    const { email } = request.body as { email: string };
    const db = (request.server as any).db;
    const normalizedEmail = email.trim().toLowerCase();

    const genericResponse = { ok: true, message: "If that email is registered, a reset link has been sent." };

    try {
      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

      // Always return success to avoid account enumeration
      if (!user) {
        return genericResponse;
      }

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      await db.update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(passwordResetTokens.userId, user.id), sql`used_at IS NULL`));

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const webOrigin = process.env.WEB_APP_URL || request.headers.origin || "";
      const resetUrl = `${webOrigin}/reset-password?token=${rawToken}`;

      const commsRes = await fetch(`${COMMS_URL}/api/comms/internal/password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-key": INTERNAL_KEY },
        body: JSON.stringify({ to: user.email, resetUrl, name: user.name }),
      }).catch(() => null);

      if (!commsRes || !commsRes.ok) {
        request.log.error({ email: normalizedEmail }, "Failed to send password reset email");
      }
    } catch (err) {
      request.log.error({ err, email: normalizedEmail }, "forgot-password handler error");
    }

    return genericResponse;
  });

  app.post("/api/auth/reset-password", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", minLength: 32 },
          newPassword: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
    },
  }, async (request, reply) => {
    const { token, newPassword } = request.body as { token: string; newPassword: string };
    const db = (request.server as any).db;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return reply.status(400).send({ error: "Invalid or expired reset link" });
    }

    const newHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, record.userId));
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));

    // Invalidate any existing sessions for security
    await db.delete(sessions).where(eq(sessions.userId, record.userId));

    return { ok: true };
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

  app.post("/api/auth/verify-mfa", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["mfaToken", "code"],
        properties: {
          mfaToken: { type: "string" },
          code: { type: "string", minLength: 6, maxLength: 6 },
        },
      },
    },
  }, async (req, reply) => {
    const { mfaToken, code } = req.body as any;
    const db = (app as any).db;

    let payload: any;
    try {
      payload = await verifyJWT(mfaToken);
    } catch {
      return reply.status(401).send({ error: "MFA session expired. Please login again." });
    }
    if (payload.purpose !== "mfa") {
      return reply.status(401).send({ error: "Invalid MFA token" });
    }

    const [mfaRecord] = await db.select().from(mfaCodes)
      .where(and(eq(mfaCodes.userId, payload.sub), eq(mfaCodes.used, false), eq(mfaCodes.purpose, "login")))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (!mfaRecord) {
      return reply.status(400).send({ error: "No active MFA code. Please login again." });
    }

    if (new Date(mfaRecord.expiresAt) < new Date()) {
      return reply.status(400).send({ error: "Code expired. Please request a new one." });
    }

    if (mfaRecord.attempts >= 5) {
      await db.update(mfaCodes).set({ used: true, usedAt: new Date() }).where(eq(mfaCodes.id, mfaRecord.id));
      return reply.status(429).send({ error: "Too many attempts. Please login again." });
    }

    if (mfaRecord.code !== code) {
      await db.update(mfaCodes).set({ attempts: sql`${mfaCodes.attempts} + 1` }).where(and(eq(mfaCodes.id, mfaRecord.id), sql`${mfaCodes.attempts} < 5`));
      return reply.status(400).send({ error: "Invalid code", attemptsRemaining: 4 - mfaRecord.attempts });
    }

    await db.update(mfaCodes).set({ used: true, usedAt: new Date() }).where(eq(mfaCodes.id, mfaRecord.id));

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) return reply.status(404).send({ error: "User not found" });

    const clientIp = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.ip || null;
    await db.update(users).set({ lastLoginAt: new Date(), lastLoginIp: clientIp }).where(eq(users.id, user.id));

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

  app.post("/api/auth/mfa/resend", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["mfaToken"],
        properties: {
          mfaToken: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const { mfaToken } = req.body as any;
    const db = (app as any).db;

    let payload: any;
    try {
      payload = await verifyJWT(mfaToken);
    } catch {
      return reply.status(401).send({ error: "MFA session expired. Please login again." });
    }
    if (payload.purpose !== "mfa") {
      return reply.status(401).send({ error: "Invalid MFA token" });
    }

    const [existing] = await db.select().from(mfaCodes)
      .where(and(eq(mfaCodes.userId, payload.sub), eq(mfaCodes.used, false)))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (existing && existing.resends >= 3) {
      return reply.status(429).send({ error: "Maximum resends reached. Please login again." });
    }

    if (existing) {
      await db.update(mfaCodes).set({ used: true, usedAt: new Date() }).where(eq(mfaCodes.id, existing.id));
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) return reply.status(404).send({ error: "User not found" });

    const code = generateMfaCode();
    await db.insert(mfaCodes).values({
      userId: user.id,
      code,
      purpose: existing?.purpose || "login",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      resends: (existing?.resends ?? 0) + 1,
    });

    const commsRes = await fetch(`${COMMS_URL}/api/comms/internal/mfa-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": INTERNAL_KEY },
      body: JSON.stringify({ to: user.email, code, name: user.name }),
    }).catch(() => null);

    if (!commsRes || !commsRes.ok) {
      return reply.status(502).send({ error: "Failed to send verification code. Please try again." });
    }

    return { success: true, resendsRemaining: 2 - (existing?.resends ?? 0) };
  });

  app.post("/api/auth/mfa/enable", {
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

    try {
      await createAndSendMfaCode(db, user.id, user.email!, user.name, "enable");
    } catch {
      return reply.status(502).send({ error: "Failed to send verification code. Please try again." });
    }
    const mfaToken = await signMfaToken(user.id, user.email!);
    return { success: true, mfaPending: true, mfaToken };
  });

  app.post("/api/auth/mfa/confirm-enable", {
    schema: {
      tags: ["Auth"],
      body: {
        type: "object",
        required: ["mfaToken", "code"],
        properties: {
          mfaToken: { type: "string" },
          code: { type: "string" },
        },
      },
    },
  }, async (req, reply) => {
    const { mfaToken, code } = req.body as any;
    const db = (app as any).db;

    let payload: any;
    try { payload = await verifyJWT(mfaToken); } catch { return reply.status(401).send({ error: "Session expired" }); }
    if (payload.purpose !== "mfa") return reply.status(401).send({ error: "Invalid token" });

    const [mfaRecord] = await db.select().from(mfaCodes)
      .where(and(eq(mfaCodes.userId, payload.sub), eq(mfaCodes.used, false), eq(mfaCodes.purpose, "enable")))
      .orderBy(sql`created_at DESC`)
      .limit(1);

    if (!mfaRecord) return reply.status(400).send({ error: "No pending code found" });
    if (new Date(mfaRecord.expiresAt) < new Date()) return reply.status(400).send({ error: "Code expired" });
    if (mfaRecord.attempts >= 5) {
      await db.update(mfaCodes).set({ used: true, usedAt: new Date() }).where(eq(mfaCodes.id, mfaRecord.id));
      return reply.status(429).send({ error: "Too many attempts" });
    }
    if (mfaRecord.code !== code) {
      await db.update(mfaCodes).set({ attempts: sql`${mfaCodes.attempts} + 1` }).where(and(eq(mfaCodes.id, mfaRecord.id), sql`${mfaCodes.attempts} < 5`));
      return reply.status(400).send({ error: "Invalid code" });
    }

    await db.update(mfaCodes).set({ used: true, usedAt: new Date() }).where(eq(mfaCodes.id, mfaRecord.id));
    await db.update(users).set({ mfaEnabled: true, mfaMethod: "email" }).where(eq(users.id, payload.sub));
    return { success: true, mfaEnabled: true };
  });

  app.post("/api/auth/mfa/disable", {
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

    if (MFA_FORCED_ROLES.includes(user.role)) {
      return reply.status(403).send({ error: "MFA cannot be disabled for admin roles" });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) return reply.status(400).send({ error: "Incorrect password" });

    await db.update(users).set({ mfaEnabled: false }).where(eq(users.id, user.id));
    return { success: true, mfaEnabled: false };
  });

  app.get("/api/auth/mfa/status", {
    schema: { tags: ["Auth"] },
  }, async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Missing authorization" });

    let payload: any;
    try { payload = await verifyJWT(auth.slice(7)); } catch { return reply.status(401).send({ error: "Invalid token" }); }

    const db = (app as any).db;
    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user) return reply.status(404).send({ error: "User not found" });

    return {
      mfaEnabled: !!user.mfaEnabled,
      mfaMethod: user.mfaMethod || "email",
      mfaForced: MFA_FORCED_ROLES.includes(user.role),
    };
  });

  setInterval(async () => {
    try {
      const db = (app as any).db;
      await db.delete(mfaCodes).where(lt(mfaCodes.expiresAt, new Date(Date.now() - 60 * 60 * 1000)));
    } catch {}
  }, 60 * 60 * 1000);
}
