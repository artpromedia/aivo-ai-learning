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

  app.post("/api/comms/internal/mfa-code", async (request, reply) => {
    const internalKey = request.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
    if (!internalKey || !expectedKey || internalKey !== expectedKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const { to, code, name } = request.body as any;
    if (!to || !code) {
      return reply.code(400).send({ error: "to and code required" });
    }
    if (!isConfigured()) {
      logger.warn({ to }, "MFA code requested but email not configured, code logged for dev");
      return { status: "dev_mode", code };
    }
    const rendered = renderTemplate("mfa_code", { code, name: name || "there" });
    try {
      const result = await sendEmail({
        to,
        subject: rendered.subject,
        htmlBody: rendered.html,
        textBody: rendered.text,
        tag: "mfa_code",
      });
      return { status: result.status, messageId: result.messageId };
    } catch (err: any) {
      logger.error({ err, to }, "Failed to send MFA code email");
      return reply.code(500).send({ error: "Failed to send MFA code" });
    }
  });

  app.post("/api/comms/internal/password-reset", async (request, reply) => {
    const internalKey = request.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
    if (!internalKey || !expectedKey || internalKey !== expectedKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const { to, resetUrl, name } = request.body as any;
    if (!to || !resetUrl) {
      return reply.code(400).send({ error: "to and resetUrl required" });
    }
    if (!isConfigured()) {
      logger.warn({ to }, "Password reset requested but email not configured, link logged for dev");
      return { status: "dev_mode", resetUrl };
    }
    const rendered = renderTemplate("password_reset", { resetUrl, name: name || "there" });
    try {
      const result = await sendEmail({
        to,
        subject: rendered.subject,
        htmlBody: rendered.html,
        textBody: rendered.text,
        tag: "password_reset",
      });
      return { status: result.status, messageId: result.messageId };
    } catch (err: any) {
      logger.error({ err, to }, "Failed to send password reset email");
      return reply.code(500).send({ error: "Failed to send password reset" });
    }
  });

  app.get("/api/comms/status", async () => {
    return {
      postmark: isConfigured() ? "connected" : "not_configured",
      push: "stub",
      sms: "not_available",
    };
  });

  app.post("/api/comms/public/contact", {
    schema: {
      tags: ["Public"],
      body: {
        type: "object",
        required: ["email", "message"],
        properties: {
          name: { type: "string", maxLength: 255 },
          email: { type: "string", format: "email", maxLength: 255 },
          message: { type: "string", maxLength: 5000 },
          source: { type: "string", maxLength: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const { name, email, message, source } = request.body as any;
    try {
      const { contactSubmissions } = await import("@aivo/db");
      await db.insert(contactSubmissions).values({
        type: "contact",
        name: name || null,
        email,
        message,
        source: source || "website",
      });
      logger.info({ email, source }, "Contact form submission stored");
      return { success: true };
    } catch (err: any) {
      logger.error({ err }, "Failed to store contact submission");
      return reply.code(500).send({ error: "Failed to submit contact form" });
    }
  });

  app.post("/api/comms/public/demo-request", {
    schema: {
      tags: ["Public"],
      body: {
        type: "object",
        required: ["email", "name"],
        properties: {
          name: { type: "string", maxLength: 255 },
          email: { type: "string", format: "email", maxLength: 255 },
          company: { type: "string", maxLength: 255 },
          role: { type: "string", maxLength: 100 },
          schoolSize: { type: "string", maxLength: 50 },
          message: { type: "string", maxLength: 5000 },
        },
      },
    },
  }, async (request, reply) => {
    const { name, email, company, role, schoolSize, message } = request.body as any;
    try {
      const { contactSubmissions } = await import("@aivo/db");
      await db.insert(contactSubmissions).values({
        type: "demo_request",
        name,
        email,
        company: company || null,
        role: role || null,
        schoolSize: schoolSize || null,
        message: message || null,
        source: "website",
      });
      logger.info({ email, company }, "Demo request stored");
      return { success: true };
    } catch (err: any) {
      logger.error({ err }, "Failed to store demo request");
      return reply.code(500).send({ error: "Failed to submit demo request" });
    }
  });

  app.post("/api/comms/public/newsletter", {
    schema: {
      tags: ["Public"],
      body: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", maxLength: 255 },
          source: { type: "string", maxLength: 100 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, source } = request.body as any;
    try {
      const { contactSubmissions } = await import("@aivo/db");
      await db.insert(contactSubmissions).values({
        type: "newsletter",
        email,
        source: source || "footer",
      });
      logger.info({ email }, "Newsletter signup stored");
      return { success: true };
    } catch (err: any) {
      logger.error({ err }, "Failed to store newsletter signup");
      return reply.code(500).send({ error: "Failed to subscribe" });
    }
  });
}
