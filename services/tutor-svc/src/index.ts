import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { registerHealthRoutes } from "./routes/health.js";
import { registerStoreRoutes } from "./routes/store.js";
import { registerChatRoutes } from "./routes/chat.js";
import { registerHomeworkRoutes } from "./routes/homework.js";
import { registerCurriculumRoutes } from "./routes/curriculum.js";
import { registerSpeechBuddyRoutes } from "./routes/speechBuddy.js";
import { registerAuthHook } from "./lib/tenant.js";

const logger = createLogger("tutor-svc");
const PORT = parseInt(process.env.TUTOR_PORT || "3006", 10);

async function start() {
  const db = createDb(process.env.DATABASE_URL!);
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(swagger, {
    openapi: {
      info: { title: "AIVO Tutor Service", version: "1.0.0" },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
      },
    },
  });
  await app.register(swaggerUI, { routePrefix: "/docs" });

  // WebSocket support for the Speech Buddy stream endpoint. The plugin is
  // optional — if `@fastify/websocket` is not installed the HTTP routes
  // continue to work and the WS upgrade is simply unavailable.
  try {
    // @ts-ignore — optional dependency; HTTP path works without it.
    const ws = await import("@fastify/websocket").catch(() => null);
    if (ws) await app.register((ws as any).default as any);
  } catch {
    /* WS plugin not installed — http path still works */
  }

  registerHealthRoutes(app);
  registerAuthHook(app);
  registerStoreRoutes(app, db);
  registerChatRoutes(app, db);
  registerHomeworkRoutes(app, db);
  registerCurriculumRoutes(app, db);
  await registerSpeechBuddyRoutes(app);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Tutor service listening on port ${PORT}`);
}

start().catch((err) => {
  console.error("Failed to start tutor-svc:", err);
  process.exit(1);
});
