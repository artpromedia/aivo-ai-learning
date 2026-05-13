# Billing — Stripe runbook

Reference for deploying and operating the Stripe-backed billing surface
introduced on branch `claude/audit-learner-experience-sLFKS`. Read this
before turning on Stripe webhooks in any environment.

## What's in the system

- `@aivo/billing-entitlements` is the canonical source for plan IDs,
  tutor SKUs, plan→tutor inclusions, and the `evaluateTutorEntitlement`
  decision function. Every service that gates tutor access reads from
  this package.
- `billing-svc` is now DB-backed end-to-end. The customer-facing routes
  read/write `subscriptions`, `tutor_subscriptions`, and `invoices`.
  Plan changes and add-on purchases hit Stripe via Checkout / the
  Subscription Items API; nothing tries to charge a card directly.
- `tutor-svc` and `learning-svc` both call `checkLearnerTutorAccess`
  before creating a session; an unentitled call gets `403` with
  `requiredSku` and `upgradePath` in the body.
- Stripe webhooks are signature-verified with the official SDK and
  acknowledged via `stripe_webhook_events` for idempotency.

## Required environment variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Server-side Stripe API key. Use a test key in non-prod. |
| `STRIPE_WEBHOOK_SECRET` | Used by `stripe.webhooks.constructEvent` to verify signatures. |
| `STRIPE_PRICE_SINGLE` | Price ID for the `single` plan. |
| `STRIPE_PRICE_FAMILY` | Price ID for the `family` plan. |
| `STRIPE_PRICE_TUTOR_ADDON` | Single price ID for the $4.99/mo tutor add-on; the line item carries the chosen tutor SKU in metadata. |
| `APP_BILLING_SUCCESS_URL` | Where Stripe Checkout redirects after a successful checkout. |
| `APP_BILLING_CANCEL_URL` | Where Stripe Checkout redirects on cancel. |
| `STRIPE_CUSTOMER_PORTAL_RETURN_URL` | Where the Customer Portal returns after the parent finishes there. |

Optional for local development:

| Variable | Purpose |
|---|---|
| `AIVO_ALLOW_UNGATED_TUTORS=true` | Skips the entitlement check in tutor-svc and learning-svc. **Never set this in production.** |

If any required Stripe var is missing, the route fails with `503
Stripe is not configured: missing <VAR_NAME>`. The webhook returns
`500 Webhook endpoint not configured`.

## Migration

Migration `0030_billing_stripe_columns.sql` adds the new columns, the
`invoices` and `stripe_webhook_events` tables, the partial unique index
on `tutor_subscriptions(user_id, tutor_sku)` (only `active`/
`grace_period` rows), and dedupes any pre-existing duplicate active
rows before creating the index.

Run before deploying the service changes:

```bash
pnpm --filter @aivo/db run build
DATABASE_URL=... pnpm --filter @aivo/db run db:migrate
```

The migration is idempotent (`IF NOT EXISTS` everywhere) so it's safe
to re-run.

If you want to see how many duplicate rows the dedup step would soft-
cancel ahead of time:

```sql
SELECT user_id, tutor_sku, COUNT(*) AS active_dupes
  FROM tutor_subscriptions
 WHERE status IN ('active', 'grace_period')
 GROUP BY 1, 2
HAVING COUNT(*) > 1;
```

## Webhook setup

1. In Stripe Dashboard → Developers → Webhooks, add an endpoint at
   `https://<billing-host>/api/billing/webhooks/stripe`.
2. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid` (or `invoice.payment_succeeded`)
   - `invoice.payment_failed`
   - `invoice.finalized`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Local development:

```bash
stripe listen --forward-to localhost:3009/api/billing/webhooks/stripe
stripe trigger checkout.session.completed
```

Each event is recorded in `stripe_webhook_events` keyed by Stripe's
`event.id`. Re-deliveries return `{ received: true, duplicate: true }`
without re-processing.

## Verifying entitlement state

```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://<billing-host>/api/billing/entitlements/<tenantId>
```

Response shape:

```json
{
  "tenantId": "...",
  "plan": "family",
  "status": "active",
  "cancelAtPeriodEnd": false,
  "currentPeriodEnd": "2026-06-01T00:00:00.000Z",
  "paymentStatus": "paid",
  "includedTutorSkus": ["ADDON_TUTOR_ELA", "ADDON_TUTOR_MATH", "..."],
  "purchasedTutorSkus": ["ADDON_TUTOR_CODING"],
  "effectiveTutorSkus": ["ADDON_TUTOR_ELA", "ADDON_TUTOR_MATH", "ADDON_TUTOR_CODING", "..."]
}
```

`tutor-svc` and `learning-svc` evaluate the same rule set locally
(they read the same DB tables) — they do not call this endpoint to
gate sessions, so the gate stays correct even if billing-svc is
temporarily unavailable.

## Manual smoke test (Stripe test mode)

1. Sign in as a parent, hit `POST /api/billing/checkout/session`,
   follow `checkoutUrl`, complete checkout with `4242 4242 4242 4242`.
2. Stripe fires `checkout.session.completed` then
   `customer.subscription.created`. Both should land in
   `stripe_webhook_events.processed_at`.
3. The `subscriptions` row appears with `stripe_status=active` and the
   correct `plan`.
4. `GET /api/billing/entitlements/:tenantId` reports the new plan.
5. Add a tutor via `POST /api/billing/addons { tenantId, tutorSku }`.
   A `tutor_subscriptions` row appears with `stripe_item_id`.
6. Cancel via `POST /api/billing/subscription/:tenantId/cancel`. The
   subscription stays accessible until `current_period_end`.

## What's intentionally out of scope

- Stripe-modeled bundle SKUs. The parent store page redirects to the
  billing page; individual tutor add-ons cover the same set of tutors.
- Mobile Stripe PaymentSheet. The mobile billing page opens the
  Customer Portal in a system browser for card changes.
- Daily reconciliation against Stripe. The webhook is the source of
  truth; a reconciliation job is on the roadmap (Sprint 5 in the
  original audit plan).

## Follow-ups

- Regenerate the `@aivo/api-client` OpenAPI snapshots after the new
  billing-svc and learning-svc routes land:

  ```bash
  node scripts/dump-openapi.mjs
  node scripts/generate-api-client.mjs
  pnpm --filter @aivo/api-client run build
  ```

- Bundle SKUs and tutor packs need to be modeled in Stripe (or removed
  from the catalog) before the store page is re-enabled for direct
  purchase.
