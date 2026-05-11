import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerAnalyzeRoutes } from "./routes/analyze.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "science-solver-svc" }));
  registerAnalyzeRoutes(app);
  return app;
}
