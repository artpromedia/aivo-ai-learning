import { FastifyInstance } from "fastify";
import { verifyJWT } from "@aivo/security";
import { sendEmail, sendBatchEmails, isConfigured } from "../lib/postmark.js";
import { renderTemplate, AVAILABLE_TEMPLATES } from "../lib/templates.js";
import { createLogger } from "@aivo/observability";

const logger = createLogger("comms-svc:notifications");

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
  app.post("/api/comms/send", { preHandler: requireAuth }, async (request, reply) => {
    const { channel, recipient, template, data } = request.body as any;
    if (!channel || !recipient || !template) {
      return reply.code(400).send({ error: "channel, recipient, and template required" });
    }

    if (channel === "email") {
      if (!isConfigured()) {
        return reply.code(503).send({ error: "Email service not configured" });
      }

      const rendered = renderTemplate(template, data || {});
      try {
        const result = await sendEmail({
          to: recipient,
          subject: rendered.subject,
          htmlBody: rendered.html,
          textBody: rendered.text,
          tag: template,
        });
        return { status: result.status, messageId: result.messageId, channel, template };
      } catch (err: any) {
        logger.error({ err, template, recipient }, "Failed to send email");
        return reply.code(500).send({ error: "Failed to send email", details: err.message });
      }
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

  app.post("/api/comms/email", { preHandler: requireAuth }, async (request, reply) => {
    const { to, subject, template, data, htmlBody, textBody } = request.body as any;
    if (!to || (!subject && !template)) {
      return reply.code(400).send({ error: "to and (subject or template) required" });
    }

    if (!isConfigured()) {
      return reply.code(503).send({ error: "Email service not configured" });
    }

    let finalSubject = subject;
    let finalHtml = htmlBody || "";
    let finalText = textBody || "";

    if (template) {
      const rendered = renderTemplate(template, data || {});
      finalSubject = finalSubject || rendered.subject;
      finalHtml = finalHtml || rendered.html;
      finalText = finalText || rendered.text;
    }

    try {
      const result = await sendEmail({
        to,
        subject: finalSubject,
        htmlBody: finalHtml,
        textBody: finalText,
        tag: template || "custom",
      });
      return { status: result.status, messageId: result.messageId, to, subject: finalSubject };
    } catch (err: any) {
      logger.error({ err, to, subject: finalSubject }, "Failed to send email");
      return reply.code(500).send({ error: "Failed to send email", details: err.message });
    }
  });

  app.post("/api/comms/email/batch", { preHandler: requireAdmin }, async (request, reply) => {
    const { emails } = request.body as any;
    if (!Array.isArray(emails) || emails.length === 0) {
      return reply.code(400).send({ error: "emails array required" });
    }
    if (emails.length > 500) {
      return reply.code(400).send({ error: "Maximum 500 emails per batch" });
    }

    if (!isConfigured()) {
      return reply.code(503).send({ error: "Email service not configured" });
    }

    const prepared = emails.map((e: any) => {
      if (e.template) {
        const rendered = renderTemplate(e.template, e.data || {});
        return {
          to: e.to,
          subject: e.subject || rendered.subject,
          htmlBody: rendered.html,
          textBody: rendered.text,
          tag: e.template,
        };
      }
      return { to: e.to, subject: e.subject, htmlBody: e.htmlBody, textBody: e.textBody };
    });

    try {
      const result = await sendBatchEmails(prepared);
      return { status: "completed", ...result };
    } catch (err: any) {
      logger.error({ err }, "Failed to send batch emails");
      return reply.code(500).send({ error: "Failed to send batch emails", details: err.message });
    }
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
    return { templates: AVAILABLE_TEMPLATES };
  });

  app.get("/api/comms/status", async () => {
    return {
      postmark: isConfigured() ? "connected" : "not_configured",
      push: "stub",
      sms: "not_available",
    };
  });
}
