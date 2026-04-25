import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const workerPath = join(here, "e2e-restart-worker.ts");

interface Recorder {
  server: http.Server;
  port: number;
  received: Array<{ id: string; title: string }>;
  shouldAccept: () => boolean;
  setShouldAccept: (fn: () => boolean) => void;
}

async function startMockReceiver(): Promise<Recorder> {
  const received: Array<{ id: string; title: string }> = [];
  let shouldAccept: () => boolean = () => true;
  const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/alerts/page") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        if (!shouldAccept()) {
          res.writeHead(503).end();
          return;
        }
        try {
          const env = JSON.parse(body);
          received.push({ id: env.id, title: env.title });
        } catch {
          /* ignore */
        }
        res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
      });
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return {
    server,
    port,
    received,
    get shouldAccept() {
      return shouldAccept;
    },
    setShouldAccept(fn) {
      shouldAccept = fn;
    },
  };
}

describe("e2e: alert survives container restart (#208)", () => {
  let recorder: Recorder;
  let outboxPath: string;

  before(async () => {
    recorder = await startMockReceiver();
    outboxPath = join(tmpdir(), `aivo-ops-alerts-e2e-${process.pid}-${Date.now()}.jsonl`);
    await fs.rm(outboxPath, { force: true });
  });

  after(async () => {
    await new Promise<void>((resolve) => recorder.server.close(() => resolve()));
    await fs.rm(outboxPath, { force: true });
  });

  it("queues during outage, persists to file, then drains after restart with proxy back up", async () => {
    // Phase 1: proxy is down — queue should land on disk.
    recorder.setShouldAccept(() => false);

    const queueResult = spawnSync(
      "node",
      ["--import", "tsx", workerPath, "queue"],
      {
        env: {
          ...process.env,
          OUTBOX_PATH: outboxPath,
          PROXY_URL: `http://127.0.0.1:${recorder.port}`,
        },
        encoding: "utf8",
      },
    );
    assert.equal(queueResult.status, 0, `queue worker failed: ${queueResult.stderr}`);
    const queuedFile = await fs.readFile(outboxPath, "utf8");
    assert.ok(queuedFile.length > 0, "outbox file should not be empty after queue phase");

    // Phase 2: proxy comes back, fresh process drains the outbox (mimics restart).
    recorder.setShouldAccept(() => true);
    const drainResult = spawnSync(
      "node",
      ["--import", "tsx", workerPath, "drain"],
      {
        env: {
          ...process.env,
          OUTBOX_PATH: outboxPath,
          PROXY_URL: `http://127.0.0.1:${recorder.port}`,
        },
        encoding: "utf8",
      },
    );
    assert.equal(drainResult.status, 0, `drain worker failed: ${drainResult.stderr}`);
    const parsed = JSON.parse(drainResult.stdout.trim());
    assert.equal(parsed.drained, 1, "expected 1 envelope drained");
    assert.equal(parsed.remaining, 0);
    assert.equal(recorder.received.length, 1, "mock receiver should have one alert");
    assert.equal(recorder.received[0].title, "e2e: queued before kill");

    const post = await fs.readFile(outboxPath, "utf8");
    assert.equal(post.trim(), "", "outbox file should be empty after drain");
  });
});
