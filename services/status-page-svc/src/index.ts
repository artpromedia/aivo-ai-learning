import Fastify from "fastify";
  import cors from "@fastify/cors";
  import swagger from "@fastify/swagger";
  import swaggerUI from "@fastify/swagger-ui";
  import { createLogger } from "@aivo/observability";
  import { registerHealthRoutes } from "./routes/health.js";
  import { registerStatusRoutes } from "./routes/status.js";

  const logger = createLogger("status-page-svc");
  const PORT = parseInt(process.env.STATUS_PAGE_SVC_PORT || "3014", 10);

  async function start() {
    const app = Fastify({ logger: false });

    await app.register(cors, { origin: true, credentials: true });
    await app.register(swagger, {
      openapi: {
        info: { title: "AIVO Status Page Service", version: "1.0.0" },
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
    registerStatusRoutes(app);

    await app.listen({ port: PORT, host: "0.0.0.0" });
    logger.info(`AIVO Status Page Service listening on port ${PORT}`);
  }

  start().catch((err) => {
    console.error("Failed to start status-page-svc:", err);
    process.exit(1);
  });
  