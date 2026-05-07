import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { stripeWebhookSchema } from "./schemas.js";

export function registerWebhookRoutes(app: FastifyInstance) {
  app.post("/api/billing/webhooks/stripe", {
    schema: stripeWebhookSchema,
    config: { rawBody: true },
  }, async (request, reply) => {
    const sig = request.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      app.log.warn("STRIPE_WEBHOOK_SECRET not configured, rejecting webhook");
      return reply.code(500).send({ error: "Webhook endpoint not configured" });
    }

    if (!sig) {
      return reply.code(400).send({ error: "Missing stripe-signature header" });
    }

    const rawBody = typeof request.body === "string" ? request.body : JSON.stringify(request.body);
    const parts = sig.split(",").reduce((acc: Record<string, string>, part: string) => {
      const [key, val] = part.split("=");
      acc[key] = val;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const expectedSig = parts["v1"];

    if (!timestamp || !expectedSig) {
      return reply.code(400).send({ error: "Invalid stripe-signature format" });
    }

    const tolerance = 300;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - parseInt(timestamp)) > tolerance) {
      return reply.code(400).send({ error: "Webhook timestamp outside tolerance" });
    }

    const computedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    if (computedSig !== expectedSig) {
      return reply.code(400).send({ error: "Invalid webhook signature" });
    }

    const event = typeof request.body === "string" ? JSON.parse(request.body) : request.body as any;
    const eventType = event?.type || "unknown";

    app.log.info({ eventType, eventId: event?.id }, "Stripe webhook received");

    return { received: true, type: eventType };
  });
}
