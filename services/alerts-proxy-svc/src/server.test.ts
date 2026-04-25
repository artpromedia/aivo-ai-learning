import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "./index.js";
import { loadChannels } from "./channels.js";

describe("alerts-proxy-svc /api/alerts/health", () => {
  it("reports productionReady=true when all required channels are configured", async () => {
    const channels = loadChannels({
      OPS_ALERTS_SLACK_WEBHOOK_URL: "https://hooks.slack.example/x",
      OPS_ALERTS_PAGERDUTY_ROUTING_KEY: "pd-key",
      OPS_ALERTS_OPSGENIE_API_KEY: "og-key",
    });
    const app = await buildServer(channels);
    const res = await app.inject({ method: "GET", url: "/api/alerts/health" });
    assert.equal(res.statusCode, 200);
    const body = res.json() as any;
    assert.deepEqual(body.channels.sort(), ["opsgenie", "pagerduty", "slack"]);
    assert.equal(body.productionReady, true);
    assert.deepEqual(body.missingRequired, []);
    await app.close();
  });

  it("reports missingRequired when channels are absent", async () => {
    const channels = loadChannels({});
    const app = await buildServer(channels);
    const res = await app.inject({ method: "GET", url: "/api/alerts/health" });
    const body = res.json() as any;
    assert.equal(body.productionReady, false);
    assert.deepEqual(body.missingRequired.sort(), ["opsgenie", "pagerduty", "slack"]);
    await app.close();
  });
});
