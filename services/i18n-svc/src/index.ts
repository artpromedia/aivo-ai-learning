import Fastify from "fastify";
  import cors from "@fastify/cors";
  import swagger from "@fastify/swagger";
  import swaggerUI from "@fastify/swagger-ui";
  import { createLogger } from "@aivo/observability";
  import { createDb } from "@aivo/db";
  import { registerHealthRoutes } from "./routes/health.js";
  import { registerTranslationRoutes } from "./routes/translations.js";

  const logger = createLogger("i18n-svc");
  const PORT = parseInt(process.env.I18N_SVC_PORT || "3011", 10);

  async function start() {
    const db = createDb(process.env.DATABASE_URL!);
    const app = Fastify({ logger: false });

    await app.register(cors, { origin: true, credentials: true });
    await app.register(swagger, {
      openapi: {
        info: { title: "AIVO Internationalization Service", version: "1.0.0" },
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
    registerTranslationRoutes(app, db);

    await app.listen({ port: PORT, host: "0.0.0.0" });
    logger.info(`AIVO Internationalization Service listening on port ${PORT}`);
  }

  start().catch((err) => {
    console.error("Failed to start i18n-svc:", err);
    process.exit(1);
  });
  