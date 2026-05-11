import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerSisRoutes } from "./routes/sis.js";
import { registerLtiRoutes } from "./routes/lti.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "integration-svc" }));
  registerSisRoutes(app);
  registerLtiRoutes(app);
  return app;
}
