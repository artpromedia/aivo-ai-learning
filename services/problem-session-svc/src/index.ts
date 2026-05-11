import { buildApp } from "./server.js";

export { buildApp } from "./server.js";
export * from "./services/problem-session-store.js";
export * from "./services/problem-session-redaction.js";
export * from "./services/problem-session-scoring.js";
export * from "./services/problem-session-client.js";

const PORT = parseInt(process.env.PROBLEM_SESSION_PORT || "3061", 10);

async function start() {
  const app = await buildApp();
  await app.listen({ port: PORT, host: "0.0.0.0" });

  console.log(`Problem session service listening on port ${PORT}`);
}

const isMain = (() => {
  try {
    return process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
  } catch {
    return false;
  }
})();

if (isMain) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
