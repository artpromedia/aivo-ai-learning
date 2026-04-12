import { FastifyInstance } from "fastify";
import { users, learners, consentRecords } from "@aivo/db";
import { verifyJWT } from "@aivo/security";
import { eq } from "drizzle-orm";
import { lookupCurriculum } from "../services/curriculum-lookup";

async function authenticate(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }
  try {
    const payload = await verifyJWT(auth.slice(7));
    req.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export async function registerUserRoutes(app: FastifyInstance) {
  app.get("/api/users/me", {
    schema: { tags: ["Users"], security: [{ bearerAuth: [] }] },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const [u] = await db.select().from(users).where(eq(users.id, user.sub)).limit(1);
    if (!u) throw { statusCode: 404, message: "User not found" };
    return { id: u.id, email: u.email, name: u.name, role: u.role, tenantId: u.tenantId, avatarUrl: u.avatarUrl };
  });

  app.get("/api/users/learners", {
    schema: { tags: ["Users"], security: [{ bearerAuth: [] }] },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const user = (req as any).user;
    if (!["PARENT", "TEACHER", "CAREGIVER", "THERAPIST", "PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      throw { statusCode: 403, message: "Not authorized" };
    }
    const results = await db.select().from(learners).where(eq(learners.tenantId, user.tenantId));
    return results;
  });

  app.post("/api/users/learners", {
    schema: {
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      body: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          dateOfBirth: { type: "string" },
          gradeLevel: { type: "string" },
          pin: { type: "string", minLength: 4, maxLength: 6 },
          diagnoses: { type: "array", items: { type: "string" } },
          zipCode: { type: "string" },
          country: { type: "string" },
          region: { type: "string" },
        },
      },
    },
    preHandler: authenticate,
  }, async (req) => {
    const db = (app as any).db;
    const user = (req as any).user;
    const body = req.body as any;

    if (user.role !== "PARENT") {
      throw { statusCode: 403, message: "Only parents can create learners" };
    }

    const [learnerUser] = await db.insert(users).values({
      tenantId: user.tenantId,
      name: body.name,
      role: "LEARNER",
      pin: body.pin,
    }).returning();

    const curriculum = lookupCurriculum({
      zipCode: body.zipCode,
      country: body.country,
    });

    const [learner] = await db.insert(learners).values({
      tenantId: user.tenantId,
      userId: learnerUser.id,
      parentId: user.sub,
      name: body.name,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      gradeLevel: body.gradeLevel,
      diagnoses: body.diagnoses || [],
      zipCode: body.zipCode,
      country: body.country || "US",
      region: body.region,
      districtId: curriculum.districtId,
      districtName: curriculum.districtName,
      curriculumFramework: curriculum.curriculumFramework,
      curriculumAlignment: curriculum.curriculumAlignment,
    }).returning();

    await db.insert(consentRecords).values({
      parentId: user.sub,
      childId: learnerUser.id,
      consentType: "COPPA_PARENTAL",
      version: "1.0",
    });

    return { learner, user: { id: learnerUser.id, name: learnerUser.name, role: "LEARNER" } };
  });
}
