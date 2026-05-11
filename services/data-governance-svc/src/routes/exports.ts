import type { FastifyInstance } from "fastify";
import { buildParentExport, type ParentExportInput } from "../services/export-builder.js";

export function registerExportRoutes(app: FastifyInstance): void {
  app.post<{ Body: ParentExportInput }>("/api/exports/parent", async (request, reply) => {
    const body = request.body;
    if (!body?.learnerId) {
      return reply.code(400).send({ error: "learnerId is required" });
    }
    const job = buildParentExport(body);
    return reply.send(job);
  });
}
