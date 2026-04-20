import { FastifyInstance } from "fastify";
import {
  users, sessions, tenants, learners, sensoryProfiles,
  schools, classrooms, classroomEnrollments, staffAssignments,
  districtSettings, districtActivityLog, iepRecords, interventions,
  appendAudit,
} from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq, and, sql, ilike, or, count, desc, asc, isNull } from "drizzle-orm";
import argon2 from "argon2";
import crypto from "crypto";

async function requireDistrictAdmin(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization" });
  }
  try {
    const payload = await verifyJWT(auth.slice(7));
    if (!["DISTRICT_ADMIN", "PLATFORM_ADMIN"].includes(payload.role as string)) {
      return reply.status(403).send({ error: "District admin access required" });
    }
    req.tenantId = payload.role === "PLATFORM_ADMIN"
      ? ((req.query as any).tenantId || payload.tenantId)
      : payload.tenantId;
    if (!req.tenantId) {
      return reply.status(400).send({ error: "No tenant context" });
    }
    req.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

function safePage(val: any): number {
  const n = parseInt(val || "1", 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}
function safePageSize(val: any, def = 20): number {
  const n = parseInt(val || String(def), 10);
  return Number.isNaN(n) || n < 1 ? def : Math.min(n, 100);
}

async function logActivity(db: any, tenantId: string, action: string, actorId: string, actorName: string, resourceType: string, resourceId?: string, details?: any) {
  // Sprint 4: chain district activity through appendAudit so the verifier
  // can walk every row.
  await appendAudit(db, "district_activity_log", districtActivityLog, {
    tenantId,
    action,
    actorId,
    actorName: actorName ?? null,
    onBehalfOfId: null,
    resourceType,
    resourceId: resourceId ?? null,
    details: details ?? null,
  });
}

export async function registerDistrictRoutes(app: FastifyInstance) {
  const db = (app as any).db;

  app.get("/api/district/stats", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const [userCount] = await db.select({ count: count() }).from(users).where(eq(users.tenantId, tid));
    const [learnerCount] = await db.select({ count: count() }).from(learners).where(eq(learners.tenantId, tid));

    const staffRoles = ["TEACHER", "THERAPIST", "CAREGIVER"];
    const [staffCount] = await db.select({ count: count() }).from(users)
      .where(and(eq(users.tenantId, tid), sql`${users.role} = ANY(ARRAY['TEACHER','THERAPIST','CAREGIVER']::user_role[])`));

    const [parentCount] = await db.select({ count: count() }).from(users)
      .where(and(eq(users.tenantId, tid), eq(users.role, "PARENT")));

    const [schoolCount] = await db.select({ count: count() }).from(schools).where(eq(schools.tenantId, tid));

    const roleCounts = await db.select({
      role: users.role,
      count: count(),
    }).from(users).where(eq(users.tenantId, tid)).groupBy(users.role);

    const flCounts = await db.select({
      level: learners.functioningLevel,
      count: count(),
    }).from(learners).where(eq(learners.tenantId, tid)).groupBy(learners.functioningLevel);

    const [iepCount] = await db.select({ count: count() }).from(iepRecords)
      .innerJoin(learners, eq(iepRecords.learnerId, learners.id))
      .where(and(eq(learners.tenantId, tid), eq(iepRecords.status, "active")));

    return {
      totalUsers: userCount.count,
      totalLearners: learnerCount.count,
      totalStaff: staffCount.count,
      totalParents: parentCount.count,
      totalSchools: schoolCount.count,
      activeIeps: iepCount.count,
      roleCounts,
      functioningLevelCounts: flCounts,
    };
  });

  app.get("/api/district/tenant", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, req.tenantId)).limit(1);
    if (!tenant) return { error: "Tenant not found" };

    const [settings] = await db.select().from(districtSettings).where(eq(districtSettings.tenantId, req.tenantId)).limit(1);
    return { ...tenant, districtSettings: settings || null };
  });

  app.get("/api/district/schools", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const { search } = req.query as any;

    let query = db.select().from(schools).where(eq(schools.tenantId, tid));
    if (search) {
      query = db.select().from(schools).where(and(eq(schools.tenantId, tid), ilike(schools.name, `%${search}%`)));
    }
    const allSchools = await query.orderBy(asc(schools.name));

    const enriched = await Promise.all(allSchools.map(async (s: any) => {
      const [lCount] = await db.select({ count: count() }).from(learners).where(and(eq(learners.schoolId, s.id), eq(learners.tenantId, tid)));
      const [sCount] = await db.select({ count: count() }).from(staffAssignments)
        .innerJoin(users, eq(staffAssignments.userId, users.id))
        .where(and(eq(staffAssignments.schoolId, s.id), isNull(staffAssignments.removedAt), eq(users.tenantId, tid)));
      return { ...s, learnerCount: lCount.count, staffCount: sCount.count };
    }));

    return { schools: enriched };
  });

  app.post("/api/district/schools", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const tid = req.tenantId;
    const { name, address, city, state, zip, phone, principalName, principalEmail, enrollmentCapacity, gradeLevels } = req.body as any;
    if (!name) return reply.status(400).send({ error: "School name is required" });

    const [school] = await db.insert(schools).values({
      tenantId: tid, name, address, city, state, zip, phone,
      principalName, principalEmail, enrollmentCapacity,
      gradeLevels: gradeLevels || [],
    }).returning();

    await logActivity(db, tid, "school.created", req.user.sub, req.user.name || req.user.email, "school", school.id, { name });
    return { school };
  });

  app.get("/api/district/schools/:id", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const [school] = await db.select().from(schools).where(and(eq(schools.id, id), eq(schools.tenantId, req.tenantId))).limit(1);
    if (!school) return reply.status(404).send({ error: "School not found" });

    const schoolLearners = await db.select({
      id: learners.id, name: learners.name, gradeLevel: learners.gradeLevel,
      functioningLevel: learners.functioningLevel, createdAt: learners.createdAt,
    }).from(learners).where(and(eq(learners.schoolId, id), eq(learners.tenantId, req.tenantId))).orderBy(asc(learners.name));

    const staffList = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
      roleAtSchool: staffAssignments.roleAtSchool, assignedAt: staffAssignments.assignedAt,
    }).from(staffAssignments)
      .innerJoin(users, eq(staffAssignments.userId, users.id))
      .where(and(eq(staffAssignments.schoolId, id), isNull(staffAssignments.removedAt), eq(users.tenantId, req.tenantId)));

    const schoolClassrooms = await db.select().from(classrooms).where(eq(classrooms.schoolId, id)).orderBy(asc(classrooms.name));

    const [lCount] = await db.select({ count: count() }).from(learners).where(and(eq(learners.schoolId, id), eq(learners.tenantId, req.tenantId)));

    return { school, learners: schoolLearners, staff: staffList, classrooms: schoolClassrooms, learnerCount: lCount.count };
  });

  app.put("/api/district/schools/:id", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const [existing] = await db.select().from(schools).where(and(eq(schools.id, id), eq(schools.tenantId, req.tenantId))).limit(1);
    if (!existing) return reply.status(404).send({ error: "School not found" });

    const body = req.body as any;
    const updates: any = {};
    for (const key of ["name", "address", "city", "state", "zip", "phone", "principalName", "principalEmail", "enrollmentCapacity", "gradeLevels", "status"]) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    updates.updatedAt = new Date();

    const [updated] = await db.update(schools).set(updates).where(eq(schools.id, id)).returning();
    await logActivity(db, req.tenantId, "school.updated", req.user.sub, req.user.name || req.user.email, "school", id, updates);
    return { school: updated };
  });

  app.get("/api/district/learners", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const { page: pageStr, pageSize: pageSizeStr, search, school: schoolId, grade, fl } = req.query as any;
    const page = safePage(pageStr);
    const pageSize = safePageSize(pageSizeStr);

    const conditions: any[] = [eq(learners.tenantId, tid)];
    if (search) conditions.push(ilike(learners.name, `%${search}%`));
    if (schoolId) conditions.push(eq(learners.schoolId, schoolId));
    if (grade) conditions.push(eq(learners.gradeLevel, grade));
    if (fl) conditions.push(eq(learners.functioningLevel, fl));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [totalRow] = await db.select({ count: count() }).from(learners).where(where);
    const rows = await db.select({
      id: learners.id, name: learners.name, gradeLevel: learners.gradeLevel,
      functioningLevel: learners.functioningLevel, schoolId: learners.schoolId,
      curriculumFramework: learners.curriculumFramework, createdAt: learners.createdAt,
      parentId: learners.parentId, userId: learners.userId,
    }).from(learners).where(where)
      .orderBy(asc(learners.name))
      .limit(pageSize).offset((page - 1) * pageSize);

    const enriched = await Promise.all(rows.map(async (l: any) => {
      const [parent] = await db.select({ id: users.id, name: users.name, email: users.email })
        .from(users).where(and(eq(users.id, l.parentId), eq(users.tenantId, tid))).limit(1);
      const [school] = l.schoolId ? await db.select({ id: schools.id, name: schools.name }).from(schools).where(and(eq(schools.id, l.schoolId), eq(schools.tenantId, tid))).limit(1) : [null];
      return { ...l, parent: parent || null, school: school || null };
    }));

    return { learners: enriched, total: totalRow.count, page, pageSize };
  });

  app.get("/api/district/learners/:id", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const [learner] = await db.select().from(learners).where(and(eq(learners.id, id), eq(learners.tenantId, req.tenantId))).limit(1);
    if (!learner) return reply.status(404).send({ error: "Learner not found" });

    const [parent] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(and(eq(users.id, learner.parentId), eq(users.tenantId, req.tenantId))).limit(1);
    const [school] = learner.schoolId ? await db.select().from(schools).where(and(eq(schools.id, learner.schoolId), eq(schools.tenantId, req.tenantId))).limit(1) : [null];

    const [sensory] = await db.select().from(sensoryProfiles).where(eq(sensoryProfiles.learnerId, id)).limit(1);

    const ieps = await db.select().from(iepRecords).where(eq(iepRecords.learnerId, id)).orderBy(desc(iepRecords.createdAt));
    const learnerInterventions = await db.select().from(interventions).where(eq(interventions.learnerId, id)).orderBy(desc(interventions.createdAt));

    return { learner, parent: parent || null, school: school || null, sensoryProfile: sensory || null, ieps, interventions: learnerInterventions };
  });

  app.get("/api/district/staff", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const { page: pageStr, pageSize: pageSizeStr, search, role, school: schoolId } = req.query as any;
    const page = safePage(pageStr);
    const pageSize = safePageSize(pageSizeStr);

    const staffRoles = ["TEACHER", "THERAPIST", "CAREGIVER", "DISTRICT_ADMIN"];
    const conditions: any[] = [
      eq(users.tenantId, tid),
      sql`${users.role} = ANY(ARRAY['TEACHER','THERAPIST','CAREGIVER','DISTRICT_ADMIN']::user_role[])`,
      isNull(users.deactivatedAt),
    ];
    if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));
    if (role) conditions.push(eq(users.role, role));

    const where = and(...conditions);

    const [totalRow] = await db.select({ count: count() }).from(users).where(where);
    const rows = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
      schoolId: users.schoolId, createdAt: users.createdAt, lastLoginAt: users.lastLoginAt,
    }).from(users).where(where)
      .orderBy(asc(users.name))
      .limit(pageSize).offset((page - 1) * pageSize);

    const enriched = await Promise.all(rows.map(async (u: any) => {
      const assignments = await db.select({
        schoolId: staffAssignments.schoolId, roleAtSchool: staffAssignments.roleAtSchool,
        schoolName: schools.name,
      }).from(staffAssignments)
        .innerJoin(schools, eq(staffAssignments.schoolId, schools.id))
        .where(and(eq(staffAssignments.userId, u.id), isNull(staffAssignments.removedAt), eq(schools.tenantId, tid)));
      return { ...u, schoolAssignments: assignments };
    }));

    let result = enriched;
    if (schoolId) {
      result = enriched.filter((u: any) => u.schoolAssignments.some((a: any) => a.schoolId === schoolId));
    }

    return { staff: result, total: totalRow.count, page, pageSize };
  });

  app.post("/api/district/staff", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const tid = req.tenantId;
    const { name, email, role, schoolId: assignSchoolId } = req.body as any;
    if (!name || !email || !role) return reply.status(400).send({ error: "Name, email, and role are required" });

    const allowedRoles = ["TEACHER", "THERAPIST", "CAREGIVER"];
    if (!allowedRoles.includes(role)) return reply.status(400).send({ error: `Invalid role. Allowed: ${allowedRoles.join(", ")}` });

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) return reply.status(409).send({ error: "Email already in use" });

    const tempPassword = crypto.randomBytes(6).toString("base64url");
    const [user] = await db.insert(users).values({
      tenantId: tid, name, email, role,
      passwordHash: await argon2.hash(tempPassword),
      schoolId: assignSchoolId || null,
    }).returning();

    if (assignSchoolId) {
      const [schoolExists] = await db.select().from(schools).where(and(eq(schools.id, assignSchoolId), eq(schools.tenantId, tid))).limit(1);
      if (schoolExists) {
        await db.insert(staffAssignments).values({ userId: user.id, schoolId: assignSchoolId }).onConflictDoNothing();
      }
    }

    await logActivity(db, tid, "staff.invited", req.user.sub, req.user.name || req.user.email, "user", user.id, { name, email, role });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      temporaryPassword: tempPassword,
    };
  });

  app.get("/api/district/staff/:id", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const [user] = await db.select({
      id: users.id, name: users.name, email: users.email, role: users.role,
      schoolId: users.schoolId, createdAt: users.createdAt, lastLoginAt: users.lastLoginAt,
      deactivatedAt: users.deactivatedAt,
    }).from(users).where(and(eq(users.id, id), eq(users.tenantId, req.tenantId))).limit(1);
    if (!user) return reply.status(404).send({ error: "Staff member not found" });

    const assignments = await db.select({
      schoolId: staffAssignments.schoolId, roleAtSchool: staffAssignments.roleAtSchool,
      schoolName: schools.name, assignedAt: staffAssignments.assignedAt,
    }).from(staffAssignments)
      .innerJoin(schools, eq(staffAssignments.schoolId, schools.id))
      .where(and(eq(staffAssignments.userId, id), isNull(staffAssignments.removedAt), eq(schools.tenantId, req.tenantId)));

    return { user, schoolAssignments: assignments };
  });

  app.put("/api/district/staff/:id", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const [existing] = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, req.tenantId))).limit(1);
    if (!existing) return reply.status(404).send({ error: "Staff member not found" });

    const body = req.body as any;
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.schoolId !== undefined) updates.schoolId = body.schoolId;
    updates.updatedAt = new Date();

    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    await logActivity(db, req.tenantId, "staff.updated", req.user.sub, req.user.name || req.user.email, "user", id, updates);
    return { user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } };
  });

  app.delete("/api/district/staff/:id", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { id } = req.params as { id: string };
    const [existing] = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, req.tenantId))).limit(1);
    if (!existing) return reply.status(404).send({ error: "Staff member not found" });
    if (existing.role === "DISTRICT_ADMIN") return reply.status(403).send({ error: "Cannot deactivate a district admin" });

    await db.update(users).set({ deactivatedAt: new Date() }).where(eq(users.id, id));
    await logActivity(db, req.tenantId, "staff.deactivated", req.user.sub, req.user.name || req.user.email, "user", id, { name: existing.name });
    return { success: true };
  });

  app.get("/api/district/families", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const { search } = req.query as any;

    const conditions: any[] = [eq(users.tenantId, tid), eq(users.role, "PARENT"), isNull(users.deactivatedAt)];
    if (search) conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));

    const parents = await db.select({
      id: users.id, name: users.name, email: users.email,
      createdAt: users.createdAt, lastLoginAt: users.lastLoginAt,
    }).from(users).where(and(...conditions)).orderBy(asc(users.name));

    const enriched = await Promise.all(parents.map(async (p: any) => {
      const kids = await db.select({ id: learners.id, name: learners.name }).from(learners).where(and(eq(learners.parentId, p.id), eq(learners.tenantId, tid)));
      return { ...p, learners: kids, learnerCount: kids.length };
    }));

    return { families: enriched };
  });

  app.get("/api/district/classrooms", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const { schoolId } = req.query as any;

    let rows;
    if (schoolId) {
      const [school] = await db.select().from(schools).where(and(eq(schools.id, schoolId), eq(schools.tenantId, tid))).limit(1);
      if (!school) return { classrooms: [] };
      rows = await db.select().from(classrooms).where(eq(classrooms.schoolId, schoolId)).orderBy(asc(classrooms.name));
    } else {
      rows = await db.select({
        id: classrooms.id, name: classrooms.name, gradeLevel: classrooms.gradeLevel,
        subject: classrooms.subject, teacherId: classrooms.teacherId, capacity: classrooms.capacity,
        schoolId: classrooms.schoolId, schoolName: schools.name, createdAt: classrooms.createdAt,
      }).from(classrooms)
        .innerJoin(schools, eq(classrooms.schoolId, schools.id))
        .where(eq(schools.tenantId, tid))
        .orderBy(asc(classrooms.name));
    }

    return { classrooms: rows };
  });

  app.post("/api/district/classrooms", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const { schoolId, name, gradeLevel, subject, teacherId, capacity } = req.body as any;
    if (!schoolId || !name) return reply.status(400).send({ error: "School and name are required" });

    const [school] = await db.select().from(schools).where(and(eq(schools.id, schoolId), eq(schools.tenantId, req.tenantId))).limit(1);
    if (!school) return reply.status(404).send({ error: "School not found in your district" });

    const [classroom] = await db.insert(classrooms).values({ schoolId, name, gradeLevel, subject, teacherId, capacity }).returning();
    await logActivity(db, req.tenantId, "classroom.created", req.user.sub, req.user.name || req.user.email, "classroom", classroom.id, { name, schoolId });
    return { classroom };
  });

  app.get("/api/district/usage", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tid)).limit(1);
    const limits = (tenant?.settings as any)?.subscription?.limits || {};

    const [userCount] = await db.select({ count: count() }).from(users).where(and(eq(users.tenantId, tid), isNull(users.deactivatedAt)));
    const [learnerCount] = await db.select({ count: count() }).from(learners).where(eq(learners.tenantId, tid));
    const [teacherCount] = await db.select({ count: count() }).from(users).where(and(eq(users.tenantId, tid), eq(users.role, "TEACHER"), isNull(users.deactivatedAt)));
    const [schoolCount] = await db.select({ count: count() }).from(schools).where(eq(schools.tenantId, tid));

    return {
      users: { used: userCount.count, limit: limits.users || 500 },
      learners: { used: learnerCount.count, limit: limits.learners || 200 },
      teachers: { used: teacherCount.count, limit: limits.teachers || 50 },
      schools: { used: schoolCount.count, limit: limits.schools || 10 },
      aiCalls: { used: 0, limit: limits.aiCalls || 10000, period: "monthly" },
      tutorSessions: { used: 0, limit: limits.tutorSessions || 5000, period: "monthly" },
      storage: { usedMb: 0, limitMb: limits.storageMb || 10240 },
      plan: (tenant?.settings as any)?.subscription?.plan || "Enterprise",
    };
  });

  app.get("/api/district/settings", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const [settings] = await db.select().from(districtSettings).where(eq(districtSettings.tenantId, req.tenantId)).limit(1);
    return settings || { notificationPrefs: {}, ssoConfig: {}, branding: {}, featureOverrides: {} };
  });

  app.put("/api/district/settings", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const body = req.body as any;
    const updates: any = { updatedAt: new Date() };
    if (body.notificationPrefs !== undefined) updates.notificationPrefs = body.notificationPrefs;
    if (body.ssoConfig !== undefined) updates.ssoConfig = body.ssoConfig;
    if (body.branding !== undefined) updates.branding = body.branding;
    if (body.featureOverrides !== undefined) updates.featureOverrides = body.featureOverrides;

    const [existing] = await db.select().from(districtSettings).where(eq(districtSettings.tenantId, tid)).limit(1);
    let result;
    if (existing) {
      [result] = await db.update(districtSettings).set(updates).where(eq(districtSettings.tenantId, tid)).returning();
    } else {
      [result] = await db.insert(districtSettings).values({ tenantId: tid, ...updates }).returning();
    }
    await logActivity(db, tid, "settings.updated", req.user.sub, req.user.name || req.user.email, "settings", tid, { fields: Object.keys(updates) });
    return result;
  });

  app.get("/api/district/activity", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const { page: pageStr, pageSize: pageSizeStr, action, resourceType } = req.query as any;
    const page = safePage(pageStr);
    const pageSize = safePageSize(pageSizeStr, 30);

    const conditions: any[] = [eq(districtActivityLog.tenantId, req.tenantId)];
    if (action) conditions.push(eq(districtActivityLog.action, action));
    if (resourceType) conditions.push(eq(districtActivityLog.resourceType, resourceType));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [totalRow] = await db.select({ count: count() }).from(districtActivityLog).where(where);
    const rows = await db.select().from(districtActivityLog).where(where)
      .orderBy(desc(districtActivityLog.createdAt))
      .limit(pageSize).offset((page - 1) * pageSize);

    return { activities: rows, total: totalRow.count, page, pageSize };
  });

  app.get("/api/district/analytics/cohorts", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const flCounts = await db.select({
      level: learners.functioningLevel,
      count: count(),
    }).from(learners).where(eq(learners.tenantId, tid)).groupBy(learners.functioningLevel);

    const [totalRow] = await db.select({ count: count() }).from(learners).where(eq(learners.tenantId, tid));
    const total = Number(totalRow.count) || 1;

    return {
      cohorts: flCounts.map((c: any) => ({
        level: c.level,
        count: Number(c.count),
        pct: Math.round((Number(c.count) / total) * 100),
      })),
      total: Number(totalRow.count),
    };
  });

  app.get("/api/district/analytics/engagement", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const [learnerCount] = await db.select({ count: count() }).from(learners).where(eq(learners.tenantId, tid));
    return {
      totalLearners: learnerCount.count,
      activeLearners: 0,
      avgSessionDuration: 0,
      completionRate: 0,
    };
  });

  app.get("/api/district/analytics/mastery", { preHandler: requireDistrictAdmin }, async (req: any) => {
    return {
      bySubject: [],
      byGrade: [],
      bySchool: [],
    };
  });

  app.get("/api/district/iep/summary", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const [activeCount] = await db.select({ count: count() }).from(iepRecords)
      .innerJoin(learners, eq(iepRecords.learnerId, learners.id))
      .where(and(eq(learners.tenantId, tid), eq(iepRecords.status, "active")));

    const today = new Date().toISOString().split("T")[0];
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    const [dueCount] = await db.select({ count: count() }).from(iepRecords)
      .innerJoin(learners, eq(iepRecords.learnerId, learners.id))
      .where(and(
        eq(learners.tenantId, tid),
        eq(iepRecords.status, "active"),
        sql`${iepRecords.reviewDate} <= ${thirtyDays}`,
        sql`${iepRecords.reviewDate} >= ${today}`,
      ));

    const [overdueCount] = await db.select({ count: count() }).from(iepRecords)
      .innerJoin(learners, eq(iepRecords.learnerId, learners.id))
      .where(and(
        eq(learners.tenantId, tid),
        eq(iepRecords.status, "active"),
        sql`${iepRecords.reviewDate} < ${today}`,
      ));

    return { active: activeCount.count, dueForReview: dueCount.count, overdue: overdueCount.count };
  });

  app.get("/api/district/iep/learners", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const rows = await db.select({
      iepId: iepRecords.id, status: iepRecords.status,
      startDate: iepRecords.startDate, reviewDate: iepRecords.reviewDate,
      disabilityCategory: iepRecords.disabilityCategory, placement: iepRecords.placement,
      goals: iepRecords.goals,
      learnerId: learners.id, learnerName: learners.name,
      gradeLevel: learners.gradeLevel, functioningLevel: learners.functioningLevel,
    }).from(iepRecords)
      .innerJoin(learners, eq(iepRecords.learnerId, learners.id))
      .where(eq(learners.tenantId, tid))
      .orderBy(asc(iepRecords.reviewDate));

    return { iepLearners: rows };
  });

  app.get("/api/district/interventions", { preHandler: requireDistrictAdmin }, async (req: any) => {
    const tid = req.tenantId;
    const { status: filterStatus } = req.query as any;

    const conditions: any[] = [eq(learners.tenantId, tid)];
    if (filterStatus) conditions.push(eq(interventions.status, filterStatus));

    const rows = await db.select({
      id: interventions.id, type: interventions.type, tier: interventions.tier,
      description: interventions.description, startDate: interventions.startDate,
      endDate: interventions.endDate, status: interventions.status,
      progressNotes: interventions.progressNotes, createdAt: interventions.createdAt,
      learnerId: learners.id, learnerName: learners.name,
    }).from(interventions)
      .innerJoin(learners, eq(interventions.learnerId, learners.id))
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(interventions.createdAt));

    return { interventions: rows };
  });

  app.post("/api/district/iep", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const body = req.body as any;
    if (!body.learnerId || !body.startDate || !body.reviewDate) {
      return reply.status(400).send({ error: "learnerId, startDate, and reviewDate are required" });
    }
    const [learner] = await db.select().from(learners).where(and(eq(learners.id, body.learnerId), eq(learners.tenantId, req.tenantId))).limit(1);
    if (!learner) return reply.status(404).send({ error: "Learner not found in your district" });

    const [iep] = await db.insert(iepRecords).values({
      learnerId: body.learnerId, startDate: body.startDate, reviewDate: body.reviewDate,
      expiryDate: body.expiryDate, caseManagerId: body.caseManagerId,
      disabilityCategory: body.disabilityCategory, placement: body.placement,
      accommodations: body.accommodations || [], goals: body.goals || [],
      services: body.services || [],
    }).returning();

    await logActivity(db, req.tenantId, "iep.created", req.user.sub, req.user.name || req.user.email, "iep", iep.id, { learnerName: learner.name });
    return { iep };
  });

  app.post("/api/district/interventions", { preHandler: requireDistrictAdmin }, async (req: any, reply: any) => {
    const body = req.body as any;
    if (!body.learnerId || !body.type || !body.startDate) {
      return reply.status(400).send({ error: "learnerId, type, and startDate are required" });
    }
    const [learner] = await db.select().from(learners).where(and(eq(learners.id, body.learnerId), eq(learners.tenantId, req.tenantId))).limit(1);
    if (!learner) return reply.status(404).send({ error: "Learner not found in your district" });

    const [intervention] = await db.insert(interventions).values({
      learnerId: body.learnerId, type: body.type, tier: body.tier || 2,
      description: body.description, startDate: body.startDate,
      assignedBy: req.user.sub,
    }).returning();

    await logActivity(db, req.tenantId, "intervention.created", req.user.sub, req.user.name || req.user.email, "intervention", intervention.id, { learnerName: learner.name });
    return { intervention };
  });
}
