import { fileURLToPath } from "node:url";
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb, type Database } from "./index.js";

export interface ProvisionedTestDatabase {
  db: Database;
  teardown: () => Promise<void>;
}

/**
 * Bootstrap a fully-migrated `@aivo/db` Database against the configured
 * `DATABASE_URL` (or an explicitly supplied URL) for use from a service's
 * test suite. Applies any pending Drizzle migrations from
 * `packages/db/drizzle` so the suite no longer assumes a developer has
 * already run `db:push` / `db:migrate` against the target DB.
 *
 * The returned `teardown` closes the underlying postgres client so the
 * Node test runner can exit instead of hanging on an open pool.
 */
export async function provisionTestDatabase(
  url: string | undefined = process.env.DATABASE_URL,
): Promise<ProvisionedTestDatabase> {
  if (!url) {
    throw new Error(
      "provisionTestDatabase: DATABASE_URL is not set — call this helper " +
        "only when tests are not skipped, or pass the URL explicitly.",
    );
  }
  const db = createDb(url);
  // Resolve `packages/db/drizzle/` whether this file is loaded from
  // `packages/db/dist/` (built) or `packages/db/src/` (tsx).
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(here, "..", "drizzle");
  await migrate(db, { migrationsFolder });
  return {
    db,
    teardown: async () => {
      try {
        await (db as unknown as { $client?: { end?: (opts?: unknown) => Promise<void> } })
          .$client?.end?.({ timeout: 2 });
      } catch {
        /* ignore — teardown is best-effort */
      }
    },
  };
}
