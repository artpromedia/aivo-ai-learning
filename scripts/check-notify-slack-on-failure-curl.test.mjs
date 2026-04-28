#!/usr/bin/env node
// End-to-end self-test for the shared `.github/actions/notify-slack-on-failure`
// composite action — the *transport* half of the contract.
//
// Sibling test `check-notify-slack-on-failure.test.mjs` already verifies
// the JSON payload the notifier *builds* is well-shaped. But that test
// never actually POSTs anywhere, so a future edit to the curl invocation
// (dropping `--data`, breaking the `Content-Type` header, sending GET
// instead of POST, mishandling the webhook URL) would still pass while
// silently making the on-call page fail to deliver.
//
// This test extracts the full `run:` shell script for both the failure
// and recovery notify steps out of `action.yml`, executes them with bash
// against a local mock webhook server bound to 127.0.0.1, and asserts on
// the captured request: method, headers, body, URL. It also exercises
// the documented "webhook URL empty -> log and exit 0" graceful-
// degradation branch so that doesn't regress to a hard failure either.
//
// Lives alongside the JSON-shape self-test rather than replacing it: the
// two cover different failure modes (payload corruption vs. transport
// regression) and either kind of break would silently page nobody.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { createServer } from "node:http";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const actionYmlPath = join(
  here,
  "..",
  ".github",
  "actions",
  "notify-slack-on-failure",
  "action.yml",
);
const raw = readFileSync(actionYmlPath, "utf8");

// Pull the full shell body of a `- name: <stepName>` step's `run: |`
// block out of action.yml. We walk the file line-by-line rather than
// shelling out to a YAML library so this test has zero deps beyond what
// the existing JSON-shape self-test already requires (node + python3 +
// jq, all preinstalled on ubuntu-latest).
//
// The block scalar's content lines are indented to a consistent column
// (8 spaces in this action — 6 for the `      run:` key plus the 2-space
// child indent). We auto-detect that indent from the first non-blank
// content line so a future cosmetic reindent of action.yml doesn't
// silently break extraction; a regression there would either fail to
// find the step or produce an empty block, both of which the assertions
// below catch loudly.
function extractRunBlock(yaml, stepName) {
  const lines = yaml.split("\n");
  let i = 0;
  while (i < lines.length) {
    if (lines[i].match(new RegExp(`^\\s*-\\s+name:\\s*${stepName}\\s*$`))) {
      break;
    }
    i++;
  }
  assert.ok(
    i < lines.length,
    `could not find step '- name: ${stepName}' in action.yml`,
  );
  while (i < lines.length && !/^\s*run:\s*\|\s*$/.test(lines[i])) {
    // Stop if we hit the next step before finding `run: |` — means the
    // step exists but doesn't have a shell script, which would be a
    // structural change we want to fail loudly on.
    assert.ok(
      !/^\s*-\s+name:/.test(lines[i + 1] ?? ""),
      `step '${stepName}' has no 'run: |' block`,
    );
    i++;
  }
  i++; // past the `run: |` line itself
  // Detect the block's indent from the first non-blank line.
  let indent = null;
  const body = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      body.push("");
      i++;
      continue;
    }
    const lineIndent = line.match(/^(\s*)/)[1].length;
    if (indent === null) {
      indent = lineIndent;
    }
    if (lineIndent < indent) {
      break;
    }
    body.push(line.slice(indent));
    i++;
  }
  // Trim trailing blank lines so the script ends cleanly.
  while (body.length > 0 && body[body.length - 1] === "") body.pop();
  const script = body.join("\n");
  assert.ok(
    script.length > 0,
    `extracted empty run block for step '${stepName}'`,
  );
  return script;
}

const failureScript = extractRunBlock(raw, "Notify Slack on failure");
const recoveryScript = extractRunBlock(raw, "Notify Slack on recovery");

// Sanity: the extracted scripts must contain the load-bearing pieces
// we're about to test. If any of these go missing in a future refactor
// (e.g., someone replaces curl with a wget or drops the explicit
// Content-Type), the regex matches here will flag it before the
// transport assertions even run.
for (const [name, script] of [
  ["failure", failureScript],
  ["recovery", recoveryScript],
]) {
  assert.match(
    script,
    /curl\b/,
    `${name} script must invoke curl (transport regression)`,
  );
  assert.match(
    script,
    /-X\s+POST/,
    `${name} script must POST to Slack (method regression)`,
  );
  assert.match(
    script,
    /Content-Type:\s*application\/json/,
    `${name} script must declare JSON content type`,
  );
  assert.match(
    script,
    /--data\b/,
    `${name} script must send a request body`,
  );
  assert.match(
    script,
    /SLACK_WEBHOOK_URL/,
    `${name} script must read SLACK_WEBHOOK_URL`,
  );
}

// --- Mock webhook server ----------------------------------------------------
// Bound to 127.0.0.1 only so this test is safe to run in any environment
// (CI runners, local dev) without exposing a port. `port: 0` lets the OS
// pick a free port, eliminating the flaky-port-collision class of bug.
function startMockServer() {
  let captured = null;
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      captured = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      };
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        url: `http://127.0.0.1:${port}/services/T000/B000/XXX`,
        getCaptured: () => captured,
        resetCaptured: () => {
          captured = null;
        },
        close: () =>
          new Promise((r) => {
            server.close(() => r());
          }),
      });
    });
  });
}

// Run a bash script with a clean env (so inherited vars from the test
// runner can't accidentally satisfy a missing input) plus the supplied
// overrides. PATH is preserved so bash can find curl/python3/tail.
//
// Async (vs spawnSync) is load-bearing: the curl invocation POSTs to a
// node `http` server running in this same process, so blocking the event
// loop with spawnSync would deadlock — the server can't accept the
// connection until the test stops waiting for curl, and curl can't
// finish until the server accepts. Returns a promise that resolves with
// `{ status, stdout, stderr }` once the child exits.
function runBash(script, env) {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", script], {
      env: {
        PATH: process.env.PATH ?? "",
        ...env,
      },
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    child.stdout.on("data", (c) => stdoutChunks.push(c));
    child.stderr.on("data", (c) => stderrChunks.push(c));
    child.on("error", reject);
    child.on("close", (status) => {
      resolve({
        status,
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
      });
    });
  });
}

const mock = await startMockServer();
try {
  // --- Failure: end-to-end POST happens with the right shape --------------
  {
    mock.resetCaptured();
    const res = await runBash(failureScript, {
      SLACK_WEBHOOK_URL: mock.url,
      CHECK_NAME: "DB schema drift check",
      TARGET: "production",
      EVENT_NAME: "schedule",
      REASON_FILE: "",
      GITHUB_RUN_URL: "https://github.com/o/r/actions/runs/123",
    });
    assert.equal(
      res.status,
      0,
      `failure script exited non-zero: stdout=${res.stdout} stderr=${res.stderr}`,
    );
    const cap = mock.getCaptured();
    assert.ok(cap, "mock webhook never received a request from failure script");
    assert.equal(cap.method, "POST", "Slack webhook must be POSTed to");
    // The URL the script POSTed to is what the mock saw as `req.url` —
    // the path portion of `mock.url`. If a future edit breaks URL
    // handling (e.g., quoting, $-expansion), the path here would be
    // wrong or empty.
    assert.equal(
      cap.url,
      "/services/T000/B000/XXX",
      "Slack webhook path must match the URL passed in via SLACK_WEBHOOK_URL",
    );
    assert.equal(
      cap.headers["content-type"],
      "application/json",
      "Slack webhook must be sent as JSON",
    );
    // Body must be a valid JSON document — the whole reason payload
    // assembly was moved into Python. Then pin the shape so a transport
    // regression that, say, double-encodes the body or drops --data
    // surfaces here.
    const payload = JSON.parse(cap.body);
    assert.equal(payload.text, ":rotating_light: DB schema drift check FAILED");
    assert.equal(payload.attachments[0].color, "danger");
    const fields = payload.attachments[0].fields;
    assert.deepEqual(
      fields.map((f) => f.title),
      ["Target", "Trigger", "Failure reason", "Run"],
    );
    assert.equal(fields.find((f) => f.title === "Target").value, "production");
    assert.equal(fields.find((f) => f.title === "Trigger").value, "schedule");
    // No REASON_FILE was supplied, so the script's fallback message must
    // be in the Failure reason field — proves the bash branch that picks
    // between `tail -n 30` and the fallback string is wired correctly.
    assert.match(
      fields.find((f) => f.title === "Failure reason").value,
      /no failure detail captured/i,
      "missing REASON_FILE must produce the documented fallback message",
    );
  }

  // --- Failure: REASON_FILE contents flow through to the POST body --------
  // Pins the bash `tail -n 30 "${REASON_FILE}"` branch end-to-end: a
  // future refactor that drops the file read or pipes the wrong stream
  // would be caught here, not in production when the on-call human gets
  // a Slack message with a missing root-cause field.
  {
    mock.resetCaptured();
    const tmpReason = join(
      process.env.RUNNER_TEMP || "/tmp",
      `notify-slack-curl-test-${process.pid}.log`,
    );
    const reasonText = [
      "http 500 on https://api.example.com/health",
      'response: {"error":"oops"}',
      "stack: at C:\\path\\file.js:10:25",
      "unicode: ✓ ✗ 🔥",
    ].join("\n");
    const { writeFileSync, unlinkSync } = await import("node:fs");
    writeFileSync(tmpReason, reasonText, "utf8");
    try {
      const res = await runBash(failureScript, {
        SLACK_WEBHOOK_URL: mock.url,
        CHECK_NAME: "Backup restore verification",
        TARGET: "",
        EVENT_NAME: "workflow_dispatch",
        REASON_FILE: tmpReason,
        GITHUB_RUN_URL: "https://github.com/o/r/actions/runs/456",
      });
      assert.equal(
        res.status,
        0,
        `failure-with-reason script exited non-zero: stdout=${res.stdout} stderr=${res.stderr}`,
      );
      const cap = mock.getCaptured();
      assert.ok(cap, "mock never received the failure-with-reason POST");
      const payload = JSON.parse(cap.body);
      // Empty TARGET -> Target field omitted; pinned end-to-end so a
      // regression doesn't introduce a noisy "Target: ''" row.
      assert.deepEqual(
        payload.attachments[0].fields.map((f) => f.title),
        ["Trigger", "Failure reason", "Run"],
      );
      assert.equal(
        payload.attachments[0].fields.find((f) => f.title === "Failure reason")
          .value,
        reasonText,
        "REASON_FILE contents must round-trip through curl --data verbatim",
      );
    } finally {
      try {
        unlinkSync(tmpReason);
      } catch {}
    }
  }

  // --- Failure: empty SLACK_WEBHOOK_URL gracefully degrades ---------------
  // Documented contract: empty webhook URL -> log a skip message and
  // exit 0, so a misconfigured secret never turns into a hard CI
  // failure. If a future edit drops the guard, the script would feed an
  // empty URL to curl and exit non-zero, breaking the calling workflow.
  {
    mock.resetCaptured();
    const res = await runBash(failureScript, {
      SLACK_WEBHOOK_URL: "",
      CHECK_NAME: "Anything",
      TARGET: "",
      EVENT_NAME: "schedule",
      REASON_FILE: "",
      GITHUB_RUN_URL: "https://example.test/run",
    });
    assert.equal(
      res.status,
      0,
      `empty-webhook failure script must exit 0; got ${res.status}, stderr=${res.stderr}`,
    );
    assert.match(
      res.stdout,
      /not configured.*skipping/i,
      "empty-webhook failure script must log the documented skip message",
    );
    assert.equal(
      mock.getCaptured(),
      null,
      "empty-webhook failure script must NOT POST anywhere",
    );
  }

  // --- Recovery: end-to-end POST happens with the right shape -------------
  {
    mock.resetCaptured();
    const res = await runBash(recoveryScript, {
      SLACK_WEBHOOK_URL: mock.url,
      CHECK_NAME: "DB schema drift check",
      TARGET: "production",
      GITHUB_RUN_URL: "https://github.com/o/r/actions/runs/789",
    });
    assert.equal(
      res.status,
      0,
      `recovery script exited non-zero: stdout=${res.stdout} stderr=${res.stderr}`,
    );
    const cap = mock.getCaptured();
    assert.ok(cap, "mock webhook never received a request from recovery script");
    assert.equal(cap.method, "POST");
    assert.equal(cap.url, "/services/T000/B000/XXX");
    assert.equal(cap.headers["content-type"], "application/json");
    const payload = JSON.parse(cap.body);
    assert.equal(
      payload.text,
      ":white_check_mark: DB schema drift check RECOVERED",
    );
    assert.equal(payload.attachments[0].color, "good");
    assert.deepEqual(
      payload.attachments[0].fields.map((f) => f.title),
      ["Target", "Run"],
    );
  }

  // --- Recovery: empty SLACK_WEBHOOK_URL gracefully degrades --------------
  // Same contract as the failure branch — a misconfigured secret on the
  // recovery side should never break the calling workflow either.
  {
    mock.resetCaptured();
    const res = await runBash(recoveryScript, {
      SLACK_WEBHOOK_URL: "",
      CHECK_NAME: "Anything",
      TARGET: "",
      GITHUB_RUN_URL: "https://example.test/run",
    });
    assert.equal(
      res.status,
      0,
      `empty-webhook recovery script must exit 0; got ${res.status}, stderr=${res.stderr}`,
    );
    assert.match(
      res.stdout,
      /not configured.*skipping/i,
      "empty-webhook recovery script must log the documented skip message",
    );
    assert.equal(
      mock.getCaptured(),
      null,
      "empty-webhook recovery script must NOT POST anywhere",
    );
  }
} finally {
  await mock.close();
}

console.log("notify-slack-on-failure curl self-test: all assertions passed");
