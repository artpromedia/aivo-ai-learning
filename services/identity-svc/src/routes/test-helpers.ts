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
import {
  users,
  mfaCodes,
  tenants,
  learners,
  learnerTeachers,
  iepProfiles,
  iepProgressNotes,
} from "@aivo/db";
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

  // Idempotent seeding for the parent IEP "Updates" timeline e2e fixture.
  // Builds two tenants:
  //   - Tenant A (B2C_FAMILY): a PARENT with a LEARNER child + a finalised
  //     IEP profile + two progress notes (one parent-visible, one internal).
  //   - Tenant B (B2B_SCHOOL): a TEACHER with no relationship to the
  //     learner above. Used to assert cross-tenant access is blocked.
  // Re-running the endpoint resets passwords + replaces the seeded notes
  // so the spec sees a deterministic timeline on every run.
  app.post<{
    Body: {
      parentEmail: string;
      parentPassword: string;
      teacherEmail: string;
      teacherPassword: string;
      learnerName?: string;
      parentNoteBody?: string;
      internalNoteBody?: string;
    };
  }>("/api/__test__/seed-iep-timeline-fixture", async (req, reply) => {
    if (!testModeEnabled()) return reply.status(404).send({ error: "Not found" });
    const db = (app as any).db;
    const {
      parentEmail,
      parentPassword,
      teacherEmail,
      teacherPassword,
      learnerName = "E2E Updates Learner",
      parentNoteBody = "PARENT_VISIBLE_NOTE_BODY: timeline e2e parent-visible",
      internalNoteBody = "INTERNAL_ONLY_NOTE_BODY: timeline e2e internal-only",
    } = req.body;
    if (!parentEmail || !parentPassword || !teacherEmail || !teacherPassword) {
      return reply.status(400).send({
        error: "parentEmail, parentPassword, teacherEmail, teacherPassword required",
      });
    }
    if (parentEmail.toLowerCase() === teacherEmail.toLowerCase()) {
      return reply.status(400).send({ error: "parent and teacher emails must differ" });
    }

    // Two distinct tenants — names keyed off the email so concurrent runs
    // with different fixtures don't collide.
    const parentTenantName = `E2E Family Tenant <${parentEmail.toLowerCase()}>`;
    const teacherTenantName = `E2E School Tenant <${teacherEmail.toLowerCase()}>`;

    let [parentTenant] = await db.select().from(tenants).where(eq(tenants.name, parentTenantName)).limit(1);
    if (!parentTenant) {
      [parentTenant] = await db.insert(tenants)
        .values({ name: parentTenantName, type: "B2C_FAMILY" as any })
        .returning();
    }
    let [teacherTenant] = await db.select().from(tenants).where(eq(tenants.name, teacherTenantName)).limit(1);
    if (!teacherTenant) {
      [teacherTenant] = await db.insert(tenants)
        .values({ name: teacherTenantName, type: "B2B_SCHOOL" as any })
        .returning();
    }

    async function upsertUser(email: string, password: string, role: string, name: string, tenantId: string) {
      const lc = email.toLowerCase();
      const passwordHash = await argon2.hash(password);
      let [u] = await db.select().from(users).where(eq(users.email, lc)).limit(1);
      if (u) {
        await db.update(users).set({
          passwordHash, role: role as any, tenantId,
          mfaEnabled: false, deactivatedAt: null,
        }).where(eq(users.id, u.id));
        [u] = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
      } else {
        [u] = await db.insert(users).values({
          email: lc, name, passwordHash, role: role as any, tenantId, mfaEnabled: false,
        }).returning();
      }
      return u;
    }

    const parentUser = await upsertUser(parentEmail, parentPassword, "PARENT", "E2E Parent", parentTenant.id);
    const teacherUser = await upsertUser(teacherEmail, teacherPassword, "TEACHER", "E2E Teacher", teacherTenant.id);

    // Learner needs an underlying user row (LEARNER role). Look up by a
    // synthetic name+parent pair so we don't need a separate email.
    const learnerUserName = `${learnerName} <${parentUser.id}>`;
    let [learnerUser] = await db.select().from(users)
      .where(and(eq(users.name, learnerUserName), eq(users.role, "LEARNER" as any))).limit(1);
    if (!learnerUser) {
      [learnerUser] = await db.insert(users).values({
        name: learnerUserName, role: "LEARNER" as any, tenantId: parentTenant.id,
      }).returning();
    } else if (learnerUser.tenantId !== parentTenant.id) {
      await db.update(users).set({ tenantId: parentTenant.id }).where(eq(users.id, learnerUser.id));
    }

    let [learner] = await db.select().from(learners)
      .where(and(eq(learners.userId, learnerUser.id), eq(learners.parentId, parentUser.id))).limit(1);
    if (!learner) {
      [learner] = await db.insert(learners).values({
        tenantId: parentTenant.id,
        userId: learnerUser.id,
        parentId: parentUser.id,
        name: learnerName,
        gradeLevel: "3",
      }).returning();
    } else if (learner.tenantId !== parentTenant.id) {
      await db.update(learners).set({ tenantId: parentTenant.id })
        .where(eq(learners.id, learner.id));
    }

    let [profile] = await db.select().from(iepProfiles)
      .where(eq(iepProfiles.learnerId, learner.id))
      .orderBy(sql`updated_at DESC`)
      .limit(1);
    if (!profile) {
      [profile] = await db.insert(iepProfiles).values({
        learnerId: learner.id,
        source: "authored",
        lifecycleState: "finalised",
        gradeLevel: "3",
      }).returning();
    } else if (profile.lifecycleState !== "finalised") {
      [profile] = await db.update(iepProfiles)
        .set({ lifecycleState: "finalised", updatedAt: new Date() })
        .where(eq(iepProfiles.id, profile.id))
        .returning();
    }

    // Reset notes for this profile so each run starts clean — otherwise
    // re-runs would accumulate duplicates that confuse the assertions.
    await db.delete(iepProgressNotes).where(eq(iepProgressNotes.iepProfileId, profile.id));
    const [parentNote] = await db.insert(iepProgressNotes).values({
      iepProfileId: profile.id,
      learnerId: learner.id,
      authorId: parentUser.id,
      body: parentNoteBody,
      visibility: "parent",
    }).returning();
    const [internalNote] = await db.insert(iepProgressNotes).values({
      iepProfileId: profile.id,
      learnerId: learner.id,
      authorId: parentUser.id,
      body: internalNoteBody,
      visibility: "internal",
    }).returning();

    return {
      parent: { id: parentUser.id, email: parentUser.email, tenantId: parentTenant.id },
      teacher: { id: teacherUser.id, email: teacherUser.email, tenantId: teacherTenant.id },
      learner: { id: learner.id, name: learner.name, tenantId: parentTenant.id },
      iepProfileId: profile.id,
      notes: { parentNoteId: parentNote.id, internalNoteId: internalNote.id },
      bodies: { parent: parentNoteBody, internal: internalNoteBody },
    };
  });

  // Idempotent seeding for the IEP authoring Playwright spec (task #14).
  // Builds a B2B_DISTRICT tenant with TEACHER + PARENT + LEARNER, plus an
  // ACCEPTED learnerTeachers link the IEP authoring writes gate on.
  // Re-running clears prior authored drafts so the spec opens against an
  // empty drafts list.
  app.post<{
    Body: {
      parentEmail: string;
      parentPassword: string;
      teacherEmail: string;
      teacherPassword: string;
      learnerName?: string;
      tenantName?: string;
    };
  }>("/api/__test__/seed-iep-authoring-fixture", async (req, reply) => {
    if (!testModeEnabled()) return reply.status(404).send({ error: "Not found" });
    const db = (app as any).db;
    const {
      parentEmail,
      parentPassword,
      teacherEmail,
      teacherPassword,
      learnerName = "E2E Authoring Learner",
      tenantName,
    } = req.body;
    if (!parentEmail || !parentPassword || !teacherEmail || !teacherPassword) {
      return reply.status(400).send({
        error: "parentEmail, parentPassword, teacherEmail, teacherPassword required",
      });
    }
    if (parentEmail.toLowerCase() === teacherEmail.toLowerCase()) {
      return reply.status(400).send({ error: "parent and teacher emails must differ" });
    }
    const tName = tenantName
      || `E2E Authoring Tenant <${teacherEmail.toLowerCase()}>`;
    let [tenant] = await db.select().from(tenants).where(eq(tenants.name, tName)).limit(1);
    if (!tenant) {
      [tenant] = await db.insert(tenants)
        .values({ name: tName, type: "B2B_DISTRICT" as any })
        .returning();
    }
    async function upsertUser(email: string, password: string, role: string, name: string, tenantId: string) {
      const lc = email.toLowerCase();
      const passwordHash = await argon2.hash(password);
      let [u] = await db.select().from(users).where(eq(users.email, lc)).limit(1);
      if (u) {
        await db.update(users).set({
          passwordHash, role: role as any, tenantId,
          mfaEnabled: false, deactivatedAt: null,
        }).where(eq(users.id, u.id));
        [u] = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
      } else {
        [u] = await db.insert(users).values({
          email: lc, name, passwordHash, role: role as any, tenantId, mfaEnabled: false,
        }).returning();
      }
      return u;
    }
    const parentUser = await upsertUser(parentEmail, parentPassword, "PARENT", "E2E Authoring Parent", tenant.id);
    const teacherUser = await upsertUser(teacherEmail, teacherPassword, "TEACHER", "E2E Authoring Teacher", tenant.id);
    const learnerUserName = `${learnerName} <${parentUser.id}>`;
    let [learnerUser] = await db.select().from(users)
      .where(and(eq(users.name, learnerUserName), eq(users.role, "LEARNER" as any))).limit(1);
    if (!learnerUser) {
      [learnerUser] = await db.insert(users).values({
        name: learnerUserName, role: "LEARNER" as any, tenantId: tenant.id,
      }).returning();
    } else if (learnerUser.tenantId !== tenant.id) {
      await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, learnerUser.id));
    }
    let [learner] = await db.select().from(learners)
      .where(and(eq(learners.userId, learnerUser.id), eq(learners.parentId, parentUser.id))).limit(1);
    if (!learner) {
      [learner] = await db.insert(learners).values({
        tenantId: tenant.id,
        userId: learnerUser.id,
        parentId: parentUser.id,
        name: learnerName,
        gradeLevel: "3",
      }).returning();
    } else if (learner.tenantId !== tenant.id) {
      await db.update(learners).set({ tenantId: tenant.id })
        .where(eq(learners.id, learner.id));
    }
    let [link] = await db.select().from(learnerTeachers).where(
      and(
        eq(learnerTeachers.learnerId, learner.id),
        eq(learnerTeachers.teacherUserId, teacherUser.id),
      ),
    ).limit(1);
    if (!link) {
      [link] = await db.insert(learnerTeachers).values({
        tenantId: tenant.id,
        learnerId: learner.id,
        teacherEmail: teacherUser.email,
        teacherUserId: teacherUser.id,
        invitedBy: parentUser.id,
        status: "ACCEPTED",
        acceptedAt: new Date(),
      } as any).returning();
    } else if (link.status !== "ACCEPTED") {
      await db.update(learnerTeachers).set({ status: "ACCEPTED", acceptedAt: new Date() })
        .where(eq(learnerTeachers.id, link.id));
    }
    // Drop pre-existing authored drafts so the drafts list opens empty.
    // Cascade FKs (migration 0013) sweep the children automatically.
    await db.delete(iepProfiles).where(
      and(eq(iepProfiles.learnerId, learner.id), eq(iepProfiles.source, "authored")),
    );
    return {
      parent: { id: parentUser.id, email: parentUser.email, tenantId: tenant.id },
      teacher: { id: teacherUser.id, email: teacherUser.email, tenantId: tenant.id },
      learner: { id: learner.id, name: learner.name, tenantId: tenant.id },
    };
  });
}
