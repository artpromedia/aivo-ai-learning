import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";

async function requireAuth(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }
  try {
    req.user = await verifyJWT(auth.slice(7));
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

async function requireAdmin(req: any, reply: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Missing authorization header" });
  }
  try {
    const payload = await verifyJWT(auth.slice(7));
    if (!["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(payload.role as string)) {
      return reply.status(403).send({ error: "Admin access required" });
    }
    req.user = payload;
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
}

export function registerNotificationRoutes(app: FastifyInstance, db: any) {
  app.post("/api/comms/send", { preHandler: requireAdmin }, async (request, reply) => {
    const { channel, recipient, template, data } = request.body as any;
    if (!channel || !recipient || !template) {
      return reply.code(400).send({ error: "channel, recipient, and template required" });
    }
    return {
      status: "queued",
      messageId: crypto.randomUUID(),
      channel,
      recipient,
      template,
      queuedAt: new Date().toISOString(),
    };
  });

  app.post("/api/comms/email", { preHandler: requireAdmin }, async (request, reply) => {
    const { to, subject, template, data } = request.body as any;
    if (!to || !subject) return reply.code(400).send({ error: "to and subject required" });
    return { status: "queued", messageId: crypto.randomUUID(), to, subject };
  });

  app.post("/api/comms/push", { preHandler: requireAdmin }, async (request, reply) => {
    const { userId, title, body, data } = request.body as any;
    if (!userId || !title) return reply.code(400).send({ error: "userId and title required" });
    return { status: "queued", messageId: crypto.randomUUID(), userId, title };
  });

  app.get("/api/comms/preferences/:userId", { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as any;
    const user = (request as any).user;
    if (user.sub !== userId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    return {
      userId,
      email: { enabled: true, digest: "daily", marketing: false },
      push: { enabled: true, sessionReminders: true, progressUpdates: true },
      sms: { enabled: false },
    };
  });

  app.put("/api/comms/preferences/:userId", { preHandler: requireAuth }, async (request, reply) => {
    const { userId } = request.params as any;
    const user = (request as any).user;
    if (user.sub !== userId && !["PLATFORM_ADMIN", "DISTRICT_ADMIN"].includes(user.role)) {
      return reply.status(403).send({ error: "Access denied" });
    }
    const prefs = request.body as any;
    return { status: "updated", userId, preferences: prefs };
  });

  app.get("/api/comms/templates", { preHandler: requireAuth }, async () => {
    return {
      templates: [
        { id: "welcome", name: "Welcome Email", channels: ["email"] },
        { id: "session_reminder", name: "Session Reminder", channels: ["push", "email"] },
        { id: "progress_report", name: "Weekly Progress Report", channels: ["email"] },
        { id: "milestone_achieved", name: "Milestone Achievement", channels: ["push"] },
        { id: "collaboration_invite", name: "Collaboration Invite", channels: ["email"] },
        { id: "iep_update", name: "IEP Goal Update", channels: ["email", "push"] },
      ],
    };
  });
}
