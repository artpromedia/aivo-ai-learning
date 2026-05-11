import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerHomeworkSessionRoutes } from "./routes/homework-sessions.js";
import { registerUploadRoutes } from "./routes/uploads.js";
import { defaultHomeworkOcrProvider, type HomeworkOcrProvider } from "./services/homework-ocr.js";

export async function buildApp(
  options: { ocrProvider?: HomeworkOcrProvider } = {},
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "homework-svc" }));
  registerHomeworkSessionRoutes(app);
  registerUploadRoutes(app, options.ocrProvider ?? defaultHomeworkOcrProvider);
  return app;
}
