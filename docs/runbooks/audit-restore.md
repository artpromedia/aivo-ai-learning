# Audit Log Restore & Chain Recovery

The three audit tables — `audit_events`, `admin_audit_log`, `district_activity_log` — are append-only hash chains. The trigger `audit_no_mutate()` aborts any `UPDATE`, `DELETE`, or `TRUNCATE` with `ERRCODE = insufficient_privilege`. Each row carries `prev_hash` and `hash`, where:

```
hash = sha256(prev_hash || canonical_json(payload))
```

`canonical_json` sorts object keys, drops `undefined`, and renders `Date` as ISO strings. The first row in a chain has `prev_hash = ''`. The verifier endpoint `GET /api/admin-svc/audit-log/verify` (PLATFORM_ADMIN only) walks every row in `seq` order and returns the first `seq` where the chain breaks, plus a per-table summary.

## Symptoms

- An `INSERT` into an audit table fails with `permission denied` → the `audit_writer` role is missing required grants. Re-run `scripts/post-merge.sh` or apply `packages/db/drizzle/0005_audit_immutability.sql` manually.
- An `UPDATE`/`DELETE` against an audit table fails with `Audit table … is append-only — UPDATE blocked` → expected behavior. The trigger is doing its job. Investigate the caller.
- `/api/admin-svc/audit-log/verify` reports `ok: false` with a non-null `brokenAtSeq` → the chain has been tampered with or someone bypassed the trigger as a superuser.

## Recovery for a broken chain

1. Snapshot the affected table to a timestamped table for forensics:
   ```sql
   CREATE TABLE audit_events_quarantine_2026_04 AS SELECT * FROM audit_events;
   ```
2. Identify the breakage with the verify endpoint and pull the row:
   ```sql
   SELECT * FROM audit_events WHERE seq = $brokenAtSeq;
   ```
3. **Do not** mutate the live table to "fix" the hash — that is the attack you are defending against. Instead, append a `CHAIN_BREAK_DETECTED` event to a fresh chain segment and notify the security team:
   ```sql
   -- Done via appendAudit() so the new row's prev_hash = previous row's hash.
   ```
4. Restore from the most recent verified snapshot if the breakage is recent. Audit tables are part of the standard PITR backup set.

## Role split rationale

`audit_writer` exists so application connections can hold a low-privilege role that only has `INSERT`/`SELECT` on audit tables. Even if the application is compromised, an attacker cannot rewrite history because `UPDATE`/`DELETE`/`TRUNCATE` are revoked AND the trigger raises. Database superusers can still bypass triggers with `ALTER TABLE … DISABLE TRIGGER`, so the chain hash provides defense-in-depth — any post-hoc edit will leave `verifyAuditRow` returning false.

## Manual chain rebuild (last resort)

Only run this on a **forensic copy**, never on the live table:

```sql
-- Rebuild prev_hash/hash deterministically from row contents (canonical JSON).
-- The deterministic JSON ordering must match `canonicalize()` in
-- packages/security/src/audit-chain.ts.
```

A node script that pages through the rows and re-derives both fields lives at `packages/security/scripts/rebuild-audit-chain.ts` (write-on-demand — not committed). After rebuild, compare new hashes to stored hashes to enumerate every tampered row.

## Operating notes

- `appendAudit()` takes a transaction-scoped Postgres advisory lock keyed on the table name (`pg_advisory_xact_lock(hashtext(tableName))`) so two concurrent inserters cannot read the same `prev_hash` and produce a fork.
- `seq` is `bigserial`, monotonically increasing per table. Gaps are normal (rolled-back transactions consume sequence values).
- Pre-existing rows from before Sprint 4 have `hash IS NULL`. The verifier treats them as legacy and reports the first chained `seq` as `chainStartSeq`.
