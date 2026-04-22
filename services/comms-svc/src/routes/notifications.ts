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

  app.post("/api/comms/internal/iep-notify", async (request, reply) => {
    const internalKey = request.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
    if (!internalKey || !expectedKey || internalKey !== expectedKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const { template, to, data } = request.body as any;
    const allowed = new Set(["iep_in_review_parent", "iep_finalised_parent", "iep_comment_mention"]);
    if (!template || !to || !allowed.has(template)) {
      return reply.code(400).send({ error: "template and to required" });
    }
    if (!isConfigured()) {
      logger.warn({ to, template }, "IEP notify requested but email not configured (dev mode)");
      return { status: "dev_mode" };
    }
    const rendered = renderTemplate(template, data || {});
    try {
      const result = await sendEmail({
        to,
        subject: rendered.subject,
        htmlBody: rendered.html,
        textBody: rendered.text,
        tag: template,
      });
      return { status: result.status, messageId: result.messageId };
    } catch (err: any) {
      logger.error({ err, to, template }, "Failed to send IEP notification");
      // Best-effort; do not propagate failure beyond a 200-with-error.
      return { status: "failed" };
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

  app.post("/api/comms/internal/district-admin-invite", async (request, reply) => {
    const internalKey = request.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
    if (!internalKey || !expectedKey || internalKey !== expectedKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const { to, name, districtName, inviteUrl } = request.body as any;
    if (!to || !inviteUrl) {
      return reply.code(400).send({ error: "to and inviteUrl required" });
    }
    if (!isConfigured()) {
      logger.warn({ to }, "District admin invite requested but email not configured, link logged for dev");
      return { status: "dev_mode", inviteUrl };
    }
    const rendered = renderTemplate("district_admin_invite", {
      name: name || "there", districtName: districtName || "your district", inviteUrl,
    });
    try {
      const result = await sendEmail({
        to, subject: rendered.subject,
        htmlBody: rendered.html, textBody: rendered.text,
        tag: "district_admin_invite",
      });
      return { status: result.status, messageId: result.messageId };
    } catch (err: any) {
      logger.error({ err, to }, "Failed to send district admin invite email");
      return reply.code(500).send({ error: "Failed to send invite" });
    }
  });

  app.post("/api/comms/internal/admin-alert", async (request, reply) => {
    const internalKey = request.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
    if (!internalKey || !expectedKey || internalKey !== expectedKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const body = request.body as any;
    const { to, severity, tutorSku, modelUsed, learnerId, flagReason, flagConfidence, contentSnippet, timestamp } = body || {};
    if (!to || !flagReason) {
      return reply.code(400).send({ error: "to and flagReason required" });
    }
    const subject = `[AIVO Safety ${String(severity || "alert").toUpperCase()}] ${flagReason} flagged on ${tutorSku || "unknown tutor"}`;
    const anonLearner = learnerId ? `learner:${String(learnerId).slice(0, 8)}…` : "unknown learner";
    const lines = [
      `Severity: ${severity || "high"}`,
      `Time: ${timestamp || new Date().toISOString()}`,
      `Tutor SKU: ${tutorSku || "n/a"}`,
      `Model: ${modelUsed || "n/a"}`,
      `Learner (anonymized): ${anonLearner}`,
      `Flag reason: ${flagReason}`,
      `Confidence: ${flagConfidence != null ? flagConfidence : "n/a"}`,
      ``,
      `--- Content snippet ---`,
      String(contentSnippet || "").slice(0, 500),
    ];
    const text = lines.join("\n");
    const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.5">${text.replace(/[<>&]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;"} as any)[c])}</pre>`;

    if (!isConfigured()) {
      logger.warn({ to, flagReason, tutorSku }, "Admin safety alert (email not configured, logged to stdout)");
      return { status: "logged_only", to, subject };
    }
    try {
      const result = await sendEmail({ to, subject, htmlBody: html, textBody: text, tag: "safety_alert" });
      return { status: result.status, messageId: result.messageId, to };
    } catch (err: any) {
      logger.error({ err, to }, "Failed to send admin safety alert");
      return reply.code(500).send({ error: "Failed to send admin alert" });
    }
  });

  // Sprint 9 — billing alert for district seat-self-service requests.
  // Internal-only; identity-svc calls this when a district admin asks
  // for more seats. Same internal-key auth as the other /internal/*
  // endpoints, dedicated payload shape so we don't piggy-back on the
  // safety-alert handler.
  app.post("/api/comms/internal/billing-alert", async (request, reply) => {
    const internalKey = request.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_SERVICE_KEY || (process.env.NODE_ENV === "production" ? "" : "aivo-internal-dev-key");
    if (!internalKey || !expectedKey || internalKey !== expectedKey) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
    const { kind, tenantId, tenantName, currentSeats, requestedSeats, requesterEmail, justification, requestId } = (request.body as any) || {};
    if (!kind || !tenantId) {
      return reply.code(400).send({ error: "kind and tenantId required" });
    }
    const to = process.env.BILLING_ALERT_EMAIL || "billing@aivo.local";
    const subject = `[AIVO Billing] ${kind} — ${tenantName || tenantId}`;
    const lines = [
      `Kind: ${kind}`,
      `Tenant: ${tenantName || ""} (${tenantId})`,
      `Requester: ${requesterEmail || "n/a"}`,
      `Current seats: ${currentSeats ?? "n/a"}`,
      `Requested seats: ${requestedSeats ?? "n/a"}`,
      `Request id: ${requestId || "n/a"}`,
      ``,
      `--- Justification ---`,
      String(justification || "").slice(0, 2000),
    ];
    const text = lines.join("\n");
    const html = `<pre style="font-family:ui-monospace,monospace;font-size:13px;line-height:1.5">${text.replace(/[<>&]/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;"} as any)[c])}</pre>`;
    if (!isConfigured()) {
      logger.warn({ to, kind, tenantId, requestId }, "Billing alert (email not configured, logged to stdout)");
      return { status: "logged_only", to, subject };
    }
    try {
      const result = await sendEmail({ to, subject, htmlBody: html, textBody: text, tag: "billing_alert" });
      return { status: result.status, messageId: result.messageId, to };
    } catch (err: any) {
      logger.error({ err, to, kind }, "Failed to send billing alert");
      return reply.code(500).send({ error: "Failed to send billing alert" });
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
