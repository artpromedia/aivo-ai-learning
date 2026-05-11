import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerExportRoutes } from "./routes/exports.js";
import { registerDeletionRoutes } from "./routes/deletion-requests.js";
import { registerDpaRoutes } from "./routes/dpa.js";
import { registerRetentionRoutes } from "./routes/retention.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "data-governance-svc" }));
  registerExportRoutes(app);
  registerDeletionRoutes(app);
  registerDpaRoutes(app);
  registerRetentionRoutes(app);
  return app;
}
