import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerEvaluateRoutes } from "./routes/evaluate.js";
import { registerPolicyRoutes } from "./routes/policy.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "responsible-ai-svc" }));
  registerEvaluateRoutes(app);
  registerPolicyRoutes(app);
  return app;
}
