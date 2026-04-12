import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { initKeys } from "@aivo/security";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerConsentRoutes } from "./routes/consent.js";
import { registerCurriculumRoutes } from "./routes/curriculum.js";
import { registerAdminRoutes } from "./routes/admin.js";

const logger = createLogger("identity-svc");
const PORT = parseInt(process.env.PORT || "3001", 10);

async function start() {
  await initKeys();

  const db = createDb(process.env.DATABASE_URL!);

  const app = Fastify({
    logger: false,
  });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || "aivo-dev-cookie-secret-change-me",
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "AIVO Identity Service",
        version: "1.0.0",
        description: "Authentication, authorization, and user management for AIVO Learning Platform",
      },
      servers: [{ url: `http://localhost:${PORT}` }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });

  app.decorate("db", db);

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerUserRoutes(app);
  await registerConsentRoutes(app);
  await registerCurriculumRoutes(app);
  await registerAdminRoutes(app);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Identity service listening on port ${PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start identity-svc");
  process.exit(1);
});
