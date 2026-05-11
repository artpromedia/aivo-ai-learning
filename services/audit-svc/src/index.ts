import { buildApp } from "./server.js";

export { buildApp } from "./server.js";
export * from "./services/audit-store.js";
export * from "./services/audit-redaction.js";
export * from "./services/audit-client.js";

const PORT = parseInt(process.env.AUDIT_PORT || "3069", 10);

const isMain = (() => {
  try {
    return process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
  } catch {
    return false;
  }
})();

if (isMain) {
  buildApp()
    .then((app) => app.listen({ port: PORT, host: "0.0.0.0" }))
    .then(() => {
      console.log(`Audit service listening on port ${PORT}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
