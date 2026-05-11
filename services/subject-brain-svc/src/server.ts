import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerSubjectContextRoutes } from "./routes/subject-context.js";
import { registerSkillGraphRoutes } from "./routes/skill-graph.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "subject-brain-svc" }));
  registerSubjectContextRoutes(app);
  registerSkillGraphRoutes(app);
  return app;
}
