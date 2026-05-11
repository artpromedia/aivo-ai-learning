import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerRecommendationRoutes } from "./routes/recommendations.js";
import { registerCandidateRoutes } from "./routes/candidates.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "recommendation-svc" }));
  registerRecommendationRoutes(app);
  registerCandidateRoutes(app);
  return app;
}
