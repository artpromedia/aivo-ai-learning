import postgres from "postgres";
import {
  OpsAlertClient,
  opsAlertOutboxStoreFromEnv,
  postgresJsOutboxClient,
  type OpsAlertOutboxStore,
} from "@aivo/ops-alerts";

const SERVICE = "billing-svc";

let cachedSql: ReturnType<typeof postgres> | null = null;

function getSharedSql(): ReturnType<typeof postgres> {
  if (cachedSql) return cachedSql;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("billing-svc ops-alerts: DATABASE_URL is required when using PG outbox");
  cachedSql = postgres(url, { max: 2 });
  return cachedSql;
}

export interface BillingOpsAlerts {
  client: OpsAlertClient;
  outbox: OpsAlertOutboxStore;
  pgRequestedButUnwired: boolean;
}

export async function buildBillingOpsAlerts(): Promise<BillingOpsAlerts> {
  const proxyUrl = process.env.ALERTS_PROXY_URL || "http://alerts-proxy-svc:3016";
  const { store, pgRequestedButUnwired } = await opsAlertOutboxStoreFromEnv({
    service: SERVICE,
    pgOutboxClient: process.env.OPS_ALERTS_OUTBOX_PG_TABLE
      ? () => postgresJsOutboxClient(getSharedSql() as any)
      : undefined,
  });
  const client = new OpsAlertClient({
    service: SERVICE,
    proxyUrl,
    outbox: store,
    autoFlushIntervalMs: parseInt(process.env.OPS_ALERTS_AUTOFLUSH_MS || "30000", 10),
  });
  return { client, outbox: store, pgRequestedButUnwired };
}
