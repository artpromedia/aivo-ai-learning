/**
 * MFA lockout helper: 5 failed attempts within 10 minutes locks out for 15
 * minutes (configurable via env). Tracked in two columns on `users` to avoid
 * an extra table.
 */
import { eq, sql } from "drizzle-orm";
import { users } from "@aivo/db";

export const MFA_LOCKOUT_THRESHOLD = parseInt(process.env.MFA_LOCKOUT_THRESHOLD || "5", 10);
export const MFA_LOCKOUT_WINDOW_MS = parseInt(process.env.MFA_LOCKOUT_WINDOW_MS || "600000", 10); // 10 min
export const MFA_LOCKOUT_DURATION_MS = parseInt(process.env.MFA_LOCKOUT_DURATION_MS || "900000", 10); // 15 min

export async function isMfaLocked(db: any, userId: string): Promise<boolean> {
  const [u] = await db
    .select({ lockedUntil: users.mfaLockedUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || !u.lockedUntil) return false;
  return new Date(u.lockedUntil).getTime() > Date.now();
}

export async function recordMfaFailure(db: any, userId: string): Promise<{ locked: boolean; attempts: number }> {
  const [u] = await db
    .select({ attempts: users.mfaFailedAttempts, lockedUntil: users.mfaLockedUntil, updatedAt: users.updatedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return { locked: false, attempts: 0 };

  const now = Date.now();
  // Reset window if last failure was outside the window. We approximate "last
  // failure time" via updatedAt — the column gets touched on every write below.
  const lastTouch = u.updatedAt ? new Date(u.updatedAt).getTime() : 0;
  const windowExpired = now - lastTouch > MFA_LOCKOUT_WINDOW_MS;
  const next = windowExpired ? 1 : (u.attempts ?? 0) + 1;

  if (next >= MFA_LOCKOUT_THRESHOLD) {
    await db
      .update(users)
      .set({
        mfaFailedAttempts: 0,
        mfaLockedUntil: new Date(now + MFA_LOCKOUT_DURATION_MS),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return { locked: true, attempts: next };
  }

  await db
    .update(users)
    .set({ mfaFailedAttempts: next, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { locked: false, attempts: next };
}

export async function clearMfaFailures(db: any, userId: string): Promise<void> {
  await db
    .update(users)
    .set({ mfaFailedAttempts: 0, mfaLockedUntil: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * If currently locked, returns seconds remaining; otherwise returns 0.
 */
export async function lockoutSecondsRemaining(db: any, userId: string): Promise<number> {
  const [u] = await db
    .select({ lockedUntil: users.mfaLockedUntil })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || !u.lockedUntil) return 0;
  const ms = new Date(u.lockedUntil).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

// `sql` re-export so callers don't need to import drizzle just to use it
// (helps keep the route file imports tidy).
export { sql };
