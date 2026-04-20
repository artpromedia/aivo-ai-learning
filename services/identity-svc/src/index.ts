import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { createLogger } from "@aivo/observability";
import { createDb } from "@aivo/db";
import { initKeys, logAdminEnterpriseFlags, assertMfaKeyConfigured, registerAdminIpAllowlist } from "@aivo/security";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerTestHelperRoutes } from "./routes/test-helpers.js";
import { registerUserRoutes } from "./routes/users.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerConsentRoutes } from "./routes/consent.js";
import { registerCurriculumRoutes } from "./routes/curriculum.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerStepUpRoutes } from "./routes/step-up.js";
import { registerDistrictRoutes } from "./routes/district.js";

const logger = createLogger("identity-svc");
const PORT = parseInt(process.env.PORT || "3001", 10);

async function start() {
  await initKeys();
  // Fail fast at boot — never let an MFA-encryption-key misconfiguration
  // become a latent issue that only surfaces when a user tries to enroll
  // their first TOTP secret. In production a missing key will throw here
  // and stop the service from starting.
  try {
    assertMfaKeyConfigured();
  } catch (e) {
    logger.error(e, "MFA encryption key validation failed at boot");
    throw e;
  }
  logAdminEnterpriseFlags(logger);

  const dbUrl = process.env.DATABASE_URL || "";
  if (
    process.env.NODE_ENV === "production" &&
    dbUrl &&
    !/[?&]sslmode=(require|verify-ca|verify-full)(?:&|$)/i.test(dbUrl)
  ) {
    logger.warn(
      "DATABASE_URL is missing sslmode=require in production. PII " +
      "(emails, password hashes, MFA codes) is being transmitted over " +
      "an unencrypted database connection. Append `?sslmode=require` " +
      "(or stronger) to your connection string immediately.",
    );
  }

  const db = createDb(dbUrl);

  const app = Fastify({
    logger: false,
  });

  const isDev = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
  let corsOrigin: boolean | string[];
  if (process.env.CORS_ORIGINS) {
    corsOrigin = process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  } else if (!isDev) {
    corsOrigin = process.env.APP_URL ? [process.env.APP_URL] : [];
  } else {
    corsOrigin = true;
  }
  logger.info({ origins: corsOrigin }, "CORS origins");

  await app.register(cors, {
    origin: corsOrigin,
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

  // Sprint 4: enforce ADMIN_IP_ALLOWLIST on /api/admin/** before any handler.
  registerAdminIpAllowlist(app);

  await registerHealthRoutes(app);
  await registerAuthRoutes(app);
  await registerUserRoutes(app);
  await registerConsentRoutes(app);
  await registerCurriculumRoutes(app);
  await registerStepUpRoutes(app);
  await registerAdminRoutes(app);
  await registerDistrictRoutes(app);
  registerTestHelperRoutes(app);

  await app.listen({ port: PORT, host: "0.0.0.0" });
  logger.info(`Identity service listening on port ${PORT}`);
}

start().catch((err) => {
  logger.error(err, "Failed to start identity-svc");
  process.exit(1);
});
