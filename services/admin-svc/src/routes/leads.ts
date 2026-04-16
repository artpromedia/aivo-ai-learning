import { FastifyInstance } from "fastify";
import { leadSubmissions } from "@aivo/db";
import { eq } from "drizzle-orm";

export function registerLeadRoutes(app: FastifyInstance, db: any) {
  app.post("/api/admin-svc/leads", async (request, reply) => {
    const body = request.body as {
      type?: string;
      name?: string;
      email?: string;
      company?: string;
      role?: string;
      message?: string;
      schoolSize?: string;
      source?: string;
    };

    if (!body.name || !body.email) {
      return reply.status(400).send({ error: "Name and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return reply.status(400).send({ error: "Invalid email address" });
    }

    const validTypes = ["contact", "demo", "newsletter"];
    const type = validTypes.includes(body.type || "") ? body.type! : "contact";

    const [submission] = await db
      .insert(leadSubmissions)
      .values({
        type,
        name: body.name,
        email: body.email,
        company: body.company || null,
        role: body.role || null,
        message: body.message || null,
        schoolSize: body.schoolSize || null,
        source: body.source || "website",
      })
      .returning({ id: leadSubmissions.id });

    return { success: true, id: submission.id };
  });

  app.post("/api/admin-svc/newsletter", async (request, reply) => {
    const body = request.body as { email?: string };

    if (!body.email) {
      return reply.status(400).send({ error: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return reply.status(400).send({ error: "Invalid email address" });
    }

    const existing = await db
      .select({ id: leadSubmissions.id })
      .from(leadSubmissions)
      .where(eq(leadSubmissions.email, body.email))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, message: "Already subscribed" };
    }

    const [submission] = await db
      .insert(leadSubmissions)
      .values({
        type: "newsletter",
        name: body.email.split("@")[0],
        email: body.email,
        source: "website",
      })
      .returning({ id: leadSubmissions.id });

    return { success: true, id: submission.id };
  });
}
