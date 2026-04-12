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

  registerHealthRoutes(app);
  registerStoreRoutes(app, db);
  registerChatRoutes(app, db);
  registerHomeworkRoutes(app, db);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Tutor service listening on port ${PORT}`);
}

start().catch((err) => {
  console.error("Failed to start tutor-svc:", err);
  process.exit(1);
});
