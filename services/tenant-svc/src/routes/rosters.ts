import type { FastifyInstance } from "fastify";
import {
  createRosterImporterStores,
  importRoster,
  type ImportPayload,
  type RosterImporterStores,
} from "../services/roster-importer.js";

const STORES: RosterImporterStores = createRosterImporterStores();

export function getRosterStoresForTest(): RosterImporterStores {
  return STORES;
}

export function registerRosterRoutes(app: FastifyInstance): void {
  app.post<{ Body: ImportPayload }>("/api/rosters/import", async (request, reply) => {
    if (!request.body?.districtId) {
      return reply.code(400).send({ error: "districtId is required" });
    }
    const result = importRoster(request.body, STORES);
    return reply.send(result);
  });
}
