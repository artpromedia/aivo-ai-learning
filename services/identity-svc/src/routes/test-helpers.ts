/**
 * Test-only routes for end-to-end and integration tests.
 *
 * These routes are ONLY registered when `IDENTITY_TEST_MODE=1` is set in the
 * environment. They MUST NEVER be enabled in production: they expose enough
 * to bypass MFA challenges (by reading the latest one-time code) and seed
 * arbitrary users.
 *
 * The startup logger surfaces a loud warning when this module registers, and
 * the route handlers themselves re-check the env flag on every request as
 * defense-in-depth (so flipping the flag at runtime instantly disables them).
 */
import { FastifyInstance } from "fastify";
import { users, mfaCodes, tenants } from "@aivo/db";
import { eq, and, sql } from "drizzle-orm";
import argon2 from "argon2";

function testModeEnabled(): boolean {
  return process.env.IDENTITY_TEST_MODE === "1" && process.env.NODE_ENV !== "production";
}

export function registerTestHelperRoutes(app: FastifyInstance) {
  if (!testModeEnabled()) return;

  app.log.warn(
    "IDENTITY_TEST_MODE=1: registering /api/__test__/* helper routes. NEVER enable in production."
  );

  // Fetch the latest unused login MFA code for an email. Used by Playwright
  // happy-path specs to complete the MFA challenge for forced-MFA roles.
  app.get<{ Params: { email: string } }>(
    "/api/__test__/last-mfa-code/:email",
    async (req, reply) => {
      if (!testModeEnabled()) return reply.status(404).send({ error: "Not found" });
      const db = (app as any).db;
      const email = decodeURIComponent(req.params.email).toLowerCase();
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) return reply.status(404).send({ error: "User not found" });
      const [latest] = await db
        .select()
        .from(mfaCodes)
        .where(
          and(
            eq(mfaCodes.userId, user.id),
            eq(mfaCodes.used, false),
            eq(mfaCodes.purpose, "login")
          )
        )
        .orderBy(sql`created_at DESC`)
        .limit(1);
      if (!latest) return reply.status(404).send({ error: "No MFA code issued" });
      return { code: latest.code, expiresAt: latest.expiresAt };
    }
  );

  // Idempotent seeding for a DISTRICT_ADMIN test fixture used by e2e specs.
  app.post<{
    Body: { email: string; password: string; tenantName?: string; mfaEnabled?: boolean };
  }>("/api/__test__/seed-district-admin", async (req, reply) => {
    if (!testModeEnabled()) return reply.status(404).send({ error: "Not found" });
    const db = (app as any).db;
    const { email, password, tenantName = "E2E District Tenant", mfaEnabled = false } = req.body;
    if (!email || !password) {
      return reply.status(400).send({ error: "email and password required" });
    }

    let [tenant] = await db.select().from(tenants).where(eq(tenants.name, tenantName)).limit(1);
    if (!tenant) {
      [tenant] = await db
        .insert(tenants)
        .values({ name: tenantName, type: "B2B_DISTRICT" as any })
        .returning();
    }

    const passwordHash = await argon2.hash(password);
    const lcEmail = email.toLowerCase();
    let [user] = await db.select().from(users).where(eq(users.email, lcEmail)).limit(1);
    if (user) {
      await db
        .update(users)
        .set({
          passwordHash,
          role: "DISTRICT_ADMIN",
          tenantId: tenant.id,
          mfaEnabled,
          deactivatedAt: null,
        })
        .where(eq(users.id, user.id));
    } else {
      [user] = await db
        .insert(users)
        .values({
          email: lcEmail,
          name: "E2E District Admin",
          passwordHash,
          role: "DISTRICT_ADMIN",
          tenantId: tenant.id,
          mfaEnabled,
        })
        .returning();
    }

    return { id: user.id, email: user.email, role: user.role, tenantId: tenant.id };
  });
}
