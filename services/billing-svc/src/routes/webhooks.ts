import { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { eq, and } from "drizzle-orm";
import {
  subscriptions,
  tutorSubscriptions,
  invoices as invoicesTable,
  stripeWebhookEvents,
} from "@aivo/db";
import { isPlanId, isTutorSku, type PlanId, type TutorSku } from "@aivo/billing-entitlements";
import { getStripe, getWebhookSecret, StripeNotConfiguredError, STRIPE_METADATA_TENANT_KEY, STRIPE_METADATA_PLAN_KEY, STRIPE_METADATA_TUTOR_SKU_KEY } from "../lib/stripe.js";
import { stripeWebhookSchema } from "./schemas.js";

/**
 * Stripe webhook receiver.
 *
 * Pipeline:
 *   1. Verify signature with the official SDK (constructEvent).
 *   2. Insert into `stripe_webhook_events` for idempotency. Conflict on
 *      the event id is the dedup signal; we acknowledge without re-work.
 *   3. Dispatch by event type to a focused handler.
 *   4. Mark `processed_at` (or `error`) on the event row so the daily
 *      reconciliation job can find stuck events.
 */
export function registerWebhookRoutes(app: FastifyInstance, db: any) {
  app.post(
    "/api/billing/webhooks/stripe",
    {
      schema: stripeWebhookSchema,
      config: { rawBody: true },
    },
    async (request, reply) => {
      let stripe: Stripe;
      let webhookSecret: string;
      try {
        stripe = getStripe();
        webhookSecret = getWebhookSecret();
      } catch (err) {
        if (err instanceof StripeNotConfiguredError) {
          app.log.warn(err.message);
          return reply.code(500).send({ error: "Webhook endpoint not configured" });
        }
        throw err;
      }

      const sig = request.headers["stripe-signature"];
      if (typeof sig !== "string") {
        return reply.code(400).send({ error: "Missing stripe-signature header" });
      }
      const rawBody =
        (request as any).rawBody ??
        (typeof request.body === "string" ? request.body : JSON.stringify(request.body));

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        app.log.warn({ err: err?.message }, "Invalid Stripe webhook signature");
        return reply.code(400).send({ error: "Invalid webhook signature" });
      }

      try {
        const inserted = await db
          .insert(stripeWebhookEvents)
          .values({ id: event.id, type: event.type })
          .onConflictDoNothing({ target: stripeWebhookEvents.id })
          .returning({ id: stripeWebhookEvents.id });
        if (inserted.length === 0) {
          return { received: true, type: event.type, duplicate: true };
        }
      } catch (err) {
        app.log.error({ err }, "Failed to record webhook idempotency row");
        // Fall through and try to process — better to double-process and
        // rely on per-handler idempotency than to drop the event.
      }

      try {
        await dispatchEvent(db, event, app.log);
        await db
          .update(stripeWebhookEvents)
          .set({ processedAt: new Date() })
          .where(eq(stripeWebhookEvents.id, event.id));
      } catch (err: any) {
        app.log.error({ err: err?.message, eventType: event.type, eventId: event.id }, "Webhook handler failed");
        await db
          .update(stripeWebhookEvents)
          .set({ error: err?.message ?? String(err) })
          .where(eq(stripeWebhookEvents.id, event.id));
        return reply.code(500).send({ error: "Webhook handler failed" });
      }

      return { received: true, type: event.type };
    },
  );
}

async function dispatchEvent(db: any, event: Stripe.Event, log: any) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session, log);
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(db, event.data.object as Stripe.Subscription, log);
      return;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription, log);
      return;
    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.finalized":
      await handleInvoiceUpsert(db, event.data.object as Stripe.Invoice, "paid");
      return;
    case "invoice.payment_failed":
      await handleInvoiceUpsert(db, event.data.object as Stripe.Invoice, "payment_failed");
      return;
    default:
      log.info({ type: event.type }, "Unhandled Stripe webhook type — acknowledged");
  }
}

function readTenantFromMetadata(metadata: Stripe.Metadata | null | undefined): string | null {
  return (metadata?.[STRIPE_METADATA_TENANT_KEY] as string | undefined) ?? null;
}

function readPlanFromMetadata(metadata: Stripe.Metadata | null | undefined): PlanId | null {
  const v = metadata?.[STRIPE_METADATA_PLAN_KEY];
  return typeof v === "string" && isPlanId(v) ? v : null;
}

function readTutorSkuFromMetadata(metadata: Stripe.Metadata | null | undefined): TutorSku | null {
  const v = metadata?.[STRIPE_METADATA_TUTOR_SKU_KEY];
  return typeof v === "string" && isTutorSku(v) ? v : null;
}

function unixToDate(secs: number | null | undefined): Date | null {
  if (!secs) return null;
  return new Date(secs * 1000);
}

async function handleCheckoutCompleted(db: any, session: Stripe.Checkout.Session, log: any) {
  const tenantId = session.client_reference_id ?? readTenantFromMetadata(session.metadata);
  if (!tenantId) {
    log.warn({ sessionId: session.id }, "Checkout session missing tenant id");
    return;
  }
  // The real subscription state arrives via customer.subscription.created
  // moments later; we just record the linkage here so the upsert can
  // attach to the right tenant by stripe_subscription_id alone.
  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
  if (!stripeCustomerId || !stripeSubscriptionId) return;

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  if (existing.length > 0) return;

  const plan = readPlanFromMetadata(session.metadata) ?? "single";
  const userId = (session.metadata?.userId as string | undefined) ?? null;
  if (!userId) {
    log.warn({ sessionId: session.id }, "Checkout session missing userId metadata; cannot create subscription row");
    return;
  }
  await db.insert(subscriptions).values({
    tenantId,
    userId,
    plan,
    stripeCustomerId,
    stripeSubscriptionId,
    stripeStatus: "active",
    status: "ACTIVE",
    paymentStatus: "paid",
  });
}

async function handleSubscriptionUpsert(db: any, sub: Stripe.Subscription, log: any) {
  const tenantId = readTenantFromMetadata(sub.metadata);
  const plan = readPlanFromMetadata(sub.metadata) ?? "single";
  const stripeCustomerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const stripeStatus = sub.status as string;
  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
  const currentPeriodStart = unixToDate(sub.current_period_start);
  const currentPeriodEnd = unixToDate(sub.current_period_end);
  const canceledAt = unixToDate(sub.canceled_at ?? undefined);
  const trialEndsAt = unixToDate(sub.trial_end ?? undefined);
  const primaryPriceId =
    sub.items.data[0]?.price?.id ?? null;

  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id))
    .limit(1);

  if (existing.length === 0) {
    if (!tenantId) {
      log.warn({ subId: sub.id }, "subscription.upsert: missing tenant metadata; cannot create row");
      return;
    }
    const userId = (sub.metadata?.userId as string | undefined) ?? null;
    if (!userId) {
      log.warn({ subId: sub.id }, "subscription.upsert: missing userId metadata; cannot create row");
      return;
    }
    await db.insert(subscriptions).values({
      tenantId,
      userId,
      plan,
      stripeCustomerId,
      stripeSubscriptionId: sub.id,
      stripePriceId: primaryPriceId,
      stripeStatus,
      status: mapStripeStatusToEnum(stripeStatus),
      cancelAtPeriodEnd,
      currentPeriodStart,
      currentPeriodEnd,
      canceledAt,
      trialEndsAt,
      paymentStatus: stripeStatus === "past_due" ? "failed" : "paid",
    });
  } else {
    await db
      .update(subscriptions)
      .set({
        plan,
        stripeCustomerId,
        stripePriceId: primaryPriceId,
        stripeStatus,
        status: mapStripeStatusToEnum(stripeStatus),
        cancelAtPeriodEnd,
        currentPeriodStart,
        currentPeriodEnd,
        canceledAt,
        trialEndsAt,
        paymentStatus: stripeStatus === "past_due" ? "failed" : "paid",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, existing[0].id));
  }

  // Reconcile tutor add-on rows against the Stripe items list. Items
  // we have but Stripe no longer reports → mark grace_period. Items
  // Stripe reports but we don't have → insert as active.
  if (tenantId) {
    await reconcileTutorItems(db, sub, tenantId, existing[0]?.userId ?? (sub.metadata?.userId as string | undefined));
  }
}

async function reconcileTutorItems(
  db: any,
  sub: Stripe.Subscription,
  tenantId: string,
  userId: string | null | undefined,
) {
  const items = sub.items.data;
  const stripeItemsBySku = new Map<TutorSku, string>();
  for (const it of items) {
    const sku = readTutorSkuFromMetadata(it.metadata);
    if (sku) stripeItemsBySku.set(sku, it.id);
  }

  const dbRows = await db
    .select()
    .from(tutorSubscriptions)
    .where(eq(tutorSubscriptions.tenantId, tenantId));

  const seen = new Set<TutorSku>();
  for (const row of dbRows) {
    const sku = isTutorSku(row.tutorSku) ? row.tutorSku : null;
    if (!sku) continue;
    const stripeItemId = stripeItemsBySku.get(sku);
    if (stripeItemId) {
      seen.add(sku);
      if (row.status !== "active" || row.stripeItemId !== stripeItemId) {
        await db
          .update(tutorSubscriptions)
          .set({ status: "active", stripeItemId, deactivatedAt: null, graceEndsAt: null })
          .where(eq(tutorSubscriptions.id, row.id));
      }
    } else if (row.status === "active") {
      const graceEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await db
        .update(tutorSubscriptions)
        .set({ status: "grace_period", deactivatedAt: new Date(), graceEndsAt })
        .where(eq(tutorSubscriptions.id, row.id));
    }
  }

  // Add-on rows present on Stripe but missing locally.
  for (const [sku, itemId] of stripeItemsBySku.entries()) {
    if (seen.has(sku)) continue;
    if (!userId) continue;
    await db
      .insert(tutorSubscriptions)
      .values({
        tenantId,
        userId,
        tutorSku: sku,
        status: "active",
        stripeItemId: itemId,
      })
      .onConflictDoNothing();
  }
}

function mapStripeStatusToEnum(stripeStatus: string): "ACTIVE" | "PAST_DUE" | "CANCELLED" | "TRIALING" {
  switch (stripeStatus) {
    case "trialing":
      return "TRIALING";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELLED";
    default:
      return "ACTIVE";
  }
}

async function handleSubscriptionDeleted(db: any, sub: Stripe.Subscription, _log: any) {
  await db
    .update(subscriptions)
    .set({
      stripeStatus: "canceled",
      status: "CANCELLED",
      cancelAtPeriodEnd: false,
      canceledAt: unixToDate(sub.canceled_at ?? undefined) ?? new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  // Tutor add-ons riding on this subscription enter grace and then
  // expire on the daily expiry job.
  const tenantId = readTenantFromMetadata(sub.metadata);
  if (tenantId) {
    const graceEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db
      .update(tutorSubscriptions)
      .set({ status: "grace_period", deactivatedAt: new Date(), graceEndsAt })
      .where(
        and(
          eq(tutorSubscriptions.tenantId, tenantId),
          eq(tutorSubscriptions.status, "active"),
        ),
      );
  }
}

async function handleInvoiceUpsert(
  db: any,
  invoice: Stripe.Invoice,
  paymentStatus: "paid" | "payment_failed",
) {
  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id ?? null;

  let tenantId = readTenantFromMetadata(invoice.metadata);
  if (!tenantId && stripeSubscriptionId) {
    const [row] = await db
      .select({ tenantId: subscriptions.tenantId })
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    tenantId = row?.tenantId ?? null;
  }
  if (!tenantId) return;

  const periodStart = unixToDate(invoice.period_start);
  const periodEnd = unixToDate(invoice.period_end);
  const paidAt =
    paymentStatus === "paid" ? unixToDate(invoice.status_transitions?.paid_at ?? undefined) ?? new Date() : null;

  const existing = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.stripeInvoiceId, invoice.id))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(invoicesTable).values({
      tenantId,
      stripeInvoiceId: invoice.id,
      stripeCustomerId,
      stripeSubscriptionId,
      number: invoice.number ?? null,
      status: invoice.status ?? "open",
      amountDue: invoice.amount_due ?? 0,
      amountPaid: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? "usd",
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
      invoicePdf: invoice.invoice_pdf ?? null,
      periodStart,
      periodEnd,
      paidAt,
    });
  } else {
    await db
      .update(invoicesTable)
      .set({
        status: invoice.status ?? "open",
        amountDue: invoice.amount_due ?? 0,
        amountPaid: invoice.amount_paid ?? 0,
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        invoicePdf: invoice.invoice_pdf ?? null,
        periodStart,
        periodEnd,
        paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoicesTable.id, existing[0].id));
  }

  // Subscription `payment_status` mirrors the latest invoice outcome
  // and is the signal entitlements use during the past_due grace window.
  if (stripeSubscriptionId) {
    await db
      .update(subscriptions)
      .set({
        paymentStatus: paymentStatus === "paid" ? "paid" : "failed",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }
}
