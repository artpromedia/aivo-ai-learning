import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerDistrictRoutes } from "./routes/districts.js";
import { registerSchoolRoutes } from "./routes/schools.js";
import { registerClassRoutes } from "./routes/classes.js";
import { registerRosterRoutes } from "./routes/rosters.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "tenant-svc" }));
  registerDistrictRoutes(app);
  registerSchoolRoutes(app);
  registerClassRoutes(app);
  registerRosterRoutes(app);
  return app;
}
