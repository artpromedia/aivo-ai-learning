import Fastify from "fastify";
  import cors from "@fastify/cors";
  import swagger from "@fastify/swagger";
  import swaggerUI from "@fastify/swagger-ui";
  import { createLogger } from "@aivo/observability";
  import { createDb } from "@aivo/db";
  import { registerHealthRoutes } from "./routes/health.js";
  import { registerNotificationRoutes } from "./routes/notifications.js";

  const logger = createLogger("comms-svc");
  const PORT = parseInt(process.env.COMMS_SVC_PORT || "3010", 10);

  async function start() {
    const db = createDb(process.env.DATABASE_URL!);
    const app = Fastify({ logger: false });

    await app.register(cors, { origin: true, credentials: true });
    await app.register(swagger, {
      openapi: {
        info: { title: "AIVO Communications Service", version: "1.0.0" },
        servers: process.env.SWAGGER_SERVER_URL
          ? [{ url: process.env.SWAGGER_SERVER_URL }]
          : (process.env.NODE_ENV === "production" ? [] : [{ url: `http://localhost:${PORT}` }]),
        components: {
          securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        },
      },
    });
    await app.register(swaggerUI, { routePrefix: "/docs" });

    registerHealthRoutes(app);
    registerNotificationRoutes(app, db);

    await app.listen({ port: PORT, host: "0.0.0.0" });
    logger.info(`AIVO Communications Service listening on port ${PORT}`);
  }

  start().catch((err) => {
    console.error("Failed to start comms-svc:", err);
    process.exit(1);
  });
  