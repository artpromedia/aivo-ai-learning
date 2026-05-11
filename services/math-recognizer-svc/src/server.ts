import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { RuleBasedMathRecognizer } from "./services/rule-based-recognizer.js";
import { registerRecognizeRoutes } from "./routes/recognize.js";
import type { MathRecognizerProvider } from "./services/provider-interface.js";

export interface BuildAppOptions {
  provider?: MathRecognizerProvider;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  const provider = options.provider ?? new RuleBasedMathRecognizer();
  await app.register(cors, { origin: true, credentials: true });
  app.get("/healthz", async () => ({ status: "ok", service: "math-recognizer-svc" }));
  registerRecognizeRoutes(app, provider);
  return app;
}
