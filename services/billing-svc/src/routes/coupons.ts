/**
 * Sprint 7 — admin coupon management routes.
 *
 *   GET    /api/billing/admin/coupons
 *   POST   /api/billing/admin/coupons
 *   DELETE /api/billing/admin/coupons/:code
 *
 * Same hand-rolled "Bearer JWT + role===PLATFORM_ADMIN" check as the daily-jobs
 * endpoint (Task #70 covers them with end-to-end auth tests).
 */
import type { FastifyInstance } from "fastify";
import { sql } from "drizzle-orm";
import { requirePlatformAdmin } from "./daily-jobs.js";

export function registerCouponRoutes(app: FastifyInstance, db: any) {
  // Defense-in-depth: ensure the table exists. Drizzle migrations would do this
  // in a real deploy, but coupons is admin-only and the dev env may not have run
  // migrations recently.
  void db
    .execute(sql`
      CREATE TABLE IF NOT EXISTS billing_coupons (
        code            varchar(64) PRIMARY KEY,
        description     text,
        discount_pct    integer NOT NULL,
        max_redemptions integer,
        redemptions     integer NOT NULL DEFAULT 0,
        active          boolean NOT NULL DEFAULT true,
        created_at      timestamptz NOT NULL DEFAULT NOW(),
        expires_at      timestamptz
      )
    `)
    .catch(() => {});

  app.get("/api/billing/admin/coupons", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;
    const result = (await db.execute(sql`
      SELECT code, description, discount_pct, max_redemptions, redemptions, active,
             created_at, expires_at
      FROM billing_coupons
      ORDER BY created_at DESC
      LIMIT 500
    `)) as { rows?: Array<Record<string, any>> } | Array<Record<string, any>>;
    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    return { coupons: rows };
  });

  app.post("/api/billing/admin/coupons", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const description = typeof body.description === "string" ? body.description : null;
    const discountPct = Number(body.discountPct);
    const maxRedemptions = body.maxRedemptions != null ? Number(body.maxRedemptions) : null;
    const expiresAt = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null;

    if (!code || !/^[A-Z0-9_-]{2,64}$/.test(code)) {
      reply.code(400).send({ error: "invalid_code" });
      return;
    }
    if (!Number.isFinite(discountPct) || discountPct < 1 || discountPct > 100) {
      reply.code(400).send({ error: "invalid_discount" });
      return;
    }

    try {
      await db.execute(sql`
        INSERT INTO billing_coupons (code, description, discount_pct, max_redemptions, expires_at)
        VALUES (${code}, ${description}, ${discountPct}, ${maxRedemptions}, ${expiresAt})
      `);
    } catch {
      reply.code(409).send({ error: "duplicate_code" });
      return;
    }
    reply.code(201).send({ ok: true, code });
  });

  app.delete("/api/billing/admin/coupons/:code", async (req, reply) => {
    const me = await requirePlatformAdmin(req, reply);
    if (!me) return;
    const params = req.params as { code: string };
    await db.execute(sql`
      UPDATE billing_coupons SET active = false WHERE code = ${params.code}
    `);
    return { ok: true, code: params.code };
  });
}
