import { FastifyInstance } from "fastify";
import { tutorHealthRootSchema, getTutorsHealthSchema } from "./schemas.js";

export function registerHealthRoutes(app: FastifyInstance) {
  const handler = async () => ({ status: "ok", service: "tutor-svc" });
  app.get("/health", { schema: tutorHealthRootSchema }, handler);
  app.get("/api/tutors/health", { schema: getTutorsHealthSchema }, handler);
}
