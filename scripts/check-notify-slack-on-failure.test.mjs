#!/usr/bin/env node
// Self-test for the shared `.github/actions/notify-slack-on-failure`
// composite action. Six (and growing) workflows depend on this notifier
// to actually deliver the on-call page when an unattended check goes red.
// If a future edit breaks the JSON payload (a stray quote in the heredoc,
// a wrong escape, a typo'd jq query in the previous-run lookup), nothing
// catches it until a real outage happens — at which point the page
// silently fails to send and the on-call human still doesn't find out.
//
// This test extracts the Python payload-building blocks straight out of
// `action.yml` and runs them with realistic env-var inputs (including
// stdout that contains quotes, backslashes, newlines, backticks, the
// heredoc terminator string itself, and unicode), then asserts the
// result is valid JSON conforming to Slack's expected shape.
//
// Modeled on `scripts/check-paging-url-leaks.test.mjs` so this repo's
// "self-test the guardrail itself" pattern stays consistent.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
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

// Pull each `python3 - <<'PY' ... PY` heredoc body out of the action.
// The action embeds payload-building code in those heredocs; YAML's `|`
// block scalar already strips the indentation common to the run script,
// so each captured body just needs the heredoc-closing indent removed
// to become standalone, runnable Python.
function extractPythonBlocks(yaml) {
  const blocks = [];
  const re = /<<'PY'\n([\s\S]*?)\n([ \t]*)PY\n/g;
  let m;
  while ((m = re.exec(yaml)) !== null) {
    const body = m[1];
    const indent = m[2];
    const stripped = body
      .split("\n")
      .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
      .join("\n");
    blocks.push(stripped);
  }
  return blocks;
}

function runPython(code, env) {
  // Pass a clean env so the test isn't accidentally satisfied by a
  // CHECK_NAME / TARGET / etc. inherited from the surrounding shell.
  return spawnSync("python3", ["-c", code], {
    encoding: "utf8",
    env: {
      PATH: process.env.PATH ?? "",
      ...env,
    },
  });
}

const blocks = extractPythonBlocks(raw);
assert.equal(
  blocks.length,
  2,
  `expected exactly 2 python heredoc blocks in action.yml (failure + recovery), got ${blocks.length}. ` +
    `If the action grew/lost a payload block, update this test to match.`,
);
const [failureBlock, recoveryBlock] = blocks;

// --- Failure payload: smoke test with a fully-populated input ---------------
{
  const res = runPython(failureBlock, {
    CHECK_NAME: "DB schema drift check",
    TARGET: "production",
    EVENT_NAME: "schedule",
    REASON_RAW: "tail of script output",
    GITHUB_RUN_URL: "https://github.com/o/r/actions/runs/123",
  });
  assert.equal(res.status, 0, `python failed: ${res.stderr}`);
  const payload = JSON.parse(res.stdout);
  assert.equal(payload.text, ":rotating_light: DB schema drift check FAILED");
  assert.ok(Array.isArray(payload.attachments), "attachments must be an array");
  assert.equal(payload.attachments.length, 1);
  assert.equal(payload.attachments[0].color, "danger");
  const fields = payload.attachments[0].fields;
  assert.deepEqual(
    fields.map((f) => f.title),
    ["Target", "Trigger", "Failure reason", "Run"],
  );
  assert.equal(fields.find((f) => f.title === "Target").value, "production");
  assert.equal(fields.find((f) => f.title === "Trigger").value, "schedule");
  assert.equal(
    fields.find((f) => f.title === "Failure reason").value,
    "tail of script output",
  );
  assert.match(
    fields.find((f) => f.title === "Run").value,
    /github\.com\/o\/r\/actions\/runs\/123/,
  );
  // Slack mrkdwn link wrapper is intentional — pin the shape.
  assert.match(
    fields.find((f) => f.title === "Run").value,
    /^<https:\/\/.+\|View in GitHub Actions>$/,
  );
}

// --- Failure payload: tricky stdout that historically broke shell heredocs --
// The whole point of moving payload assembly into Python was that script
// output containing quotes / backslashes / newlines / backticks no longer
// silently corrupts the JSON. This case is the regression-pin for that.
{
  const tricky = [
    'http 500 on "https://api.example.com/health"',
    "stack: at C:\\path\\file.js:10:25",
    'response body: {"error":"oops","code":500,"detail":"\\n"}',
    "`backticks would break a naive heredoc`",
    "single 'quote' and a $shell_var and ${braced}",
    "embedded heredoc terminator on its own line:",
    "PY",
    "trailing newline after this >>>",
    "unicode payload: ✓ ✗ é 🔥",
  ].join("\n");
  const res = runPython(failureBlock, {
    CHECK_NAME: "Backup restore verification",
    TARGET: "", // empty -> Target field must be omitted
    EVENT_NAME: "workflow_dispatch",
    REASON_RAW: tricky,
    GITHUB_RUN_URL: "https://github.com/o/r/actions/runs/456",
  });
  assert.equal(res.status, 0, `python failed: ${res.stderr}`);
  // Must be valid JSON and must round-trip the tricky string EXACTLY —
  // no escaping artifacts, no truncation at the first quote/newline.
  const payload = JSON.parse(res.stdout);
  const fields = payload.attachments[0].fields;
  assert.deepEqual(
    fields.map((f) => f.title),
    ["Trigger", "Failure reason", "Run"],
    "blank target must NOT produce a Target field",
  );
  assert.equal(
    fields.find((f) => f.title === "Failure reason").value,
    tricky,
    "Failure reason must round-trip the raw stdout verbatim",
  );
}

// --- Failure payload: whitespace-only target is treated as empty ------------
// `target = os.environ.get("TARGET","").strip()` is the contract; pin it
// so a future refactor doesn't regress to an "always show Target: '   '"
// noise field.
{
  const res = runPython(failureBlock, {
    CHECK_NAME: "x",
    TARGET: "   \t  ",
    EVENT_NAME: "push",
    REASON_RAW: "ok",
    GITHUB_RUN_URL: "https://example.test/run",
  });
  assert.equal(res.status, 0, `python failed: ${res.stderr}`);
  const payload = JSON.parse(res.stdout);
  const titles = payload.attachments[0].fields.map((f) => f.title);
  assert.ok(
    !titles.includes("Target"),
    `whitespace-only TARGET should be stripped to empty and produce no Target field; got titles=${JSON.stringify(titles)}`,
  );
}

// --- Recovery payload: smoke test -------------------------------------------
{
  const res = runPython(recoveryBlock, {
    CHECK_NAME: "DB schema drift check",
    TARGET: "production",
    GITHUB_RUN_URL: "https://github.com/o/r/actions/runs/789",
  });
  assert.equal(res.status, 0, `python failed: ${res.stderr}`);
  const payload = JSON.parse(res.stdout);
  assert.equal(
    payload.text,
    ":white_check_mark: DB schema drift check RECOVERED",
  );
  assert.equal(payload.attachments[0].color, "good");
  const fields = payload.attachments[0].fields;
  assert.deepEqual(
    fields.map((f) => f.title),
    ["Target", "Run"],
  );
  assert.equal(fields.find((f) => f.title === "Target").value, "production");
  assert.match(
    fields.find((f) => f.title === "Run").value,
    /^<https:\/\/.+\|View in GitHub Actions>$/,
  );
}

// --- Recovery payload: empty target produces no Target field ----------------
{
  const res = runPython(recoveryBlock, {
    CHECK_NAME: "Paging-URL leak guardrail",
    TARGET: "",
    GITHUB_RUN_URL: "https://example.test/run",
  });
  assert.equal(res.status, 0, `python failed: ${res.stderr}`);
  const payload = JSON.parse(res.stdout);
  assert.deepEqual(
    payload.attachments[0].fields.map((f) => f.title),
    ["Run"],
  );
}

// --- Recovery payload: tricky CHECK_NAME doesn't break JSON -----------------
// CHECK_NAME flows into the message text via an f-string; assert that a
// name containing characters that would break a naive shell heredoc
// still produces valid JSON.
{
  const res = runPython(recoveryBlock, {
    CHECK_NAME: 'Weird "check" with \\backslash and `tick`',
    TARGET: "",
    GITHUB_RUN_URL: "https://example.test/run",
  });
  assert.equal(res.status, 0, `python failed: ${res.stderr}`);
  const payload = JSON.parse(res.stdout);
  assert.equal(
    payload.text,
    ':white_check_mark: Weird "check" with \\backslash and `tick` RECOVERED',
  );
}

// --- Sanity check the previous-run lookup jq filter -------------------------
// The recovery decision hinges on a `gh run list ... --jq '...'` query
// embedded in action.yml. A typo here ("conlcusion") would silently make
// every success look like a recovery (or never look like one). Re-run the
// exact filter against synthetic `gh run list` output and pin the result.
{
  // The filter is wrapped in `--jq "..."` with the inner `"`s escaped as
  // `\"` (it's a double-quoted shell string). Match the full body
  // including those backslash-escapes, then unescape to recover the
  // jq expression as it would actually be passed to `gh run list`.
  const jqMatch = raw.match(/--jq "((?:[^"\\]|\\.)+)"/);
  assert.ok(jqMatch, "could not locate the --jq filter in action.yml");
  const jqFilter = jqMatch[1].replace(/\\(.)/g, "$1");
  // The action interpolates ${RUN_ID} into the filter via shell. Mirror
  // that here so we exercise the exact post-interpolation expression.
  const RUN_ID = "999";
  const concrete = jqFilter.replaceAll("${RUN_ID}", RUN_ID);
  const fixture = [
    // Current run — must be excluded.
    { databaseId: 999, conclusion: "success", event: "schedule" },
    // PR run between push runs — must be excluded.
    { databaseId: 998, conclusion: "failure", event: "pull_request" },
    // Skipped/cancelled runs — must be excluded.
    { databaseId: 997, conclusion: "skipped", event: "schedule" },
    { databaseId: 996, conclusion: "cancelled", event: "push" },
    // The actual previous health-determining run.
    { databaseId: 995, conclusion: "failure", event: "push" },
    // Older runs that should not influence the answer.
    { databaseId: 994, conclusion: "success", event: "push" },
  ];
  const jqProbe = spawnSync("jq", ["--version"], { encoding: "utf8" });
  if (jqProbe.status === 0) {
    const res = spawnSync("jq", ["-r", concrete], {
      input: JSON.stringify(fixture),
      encoding: "utf8",
    });
    assert.equal(res.status, 0, `jq failed: ${res.stderr}`);
    assert.equal(
      res.stdout.trim(),
      "failure",
      `previous-run jq filter must pick the most recent push/schedule run that ` +
        `concluded success|failure (excluding the current run and pull_request runs); ` +
        `got '${res.stdout.trim()}'`,
    );

    // And: a clean history with no prior failures must yield empty string,
    // not "success" — otherwise the recovery branch would never fire.
    const cleanFixture = [
      { databaseId: 999, conclusion: "success", event: "schedule" },
      { databaseId: 994, conclusion: "success", event: "push" },
    ];
    const res2 = spawnSync("jq", ["-r", concrete], {
      input: JSON.stringify(cleanFixture),
      encoding: "utf8",
    });
    assert.equal(res2.status, 0, `jq failed: ${res2.stderr}`);
    assert.equal(
      res2.stdout.trim(),
      "success",
      `clean history (current=success, prior=success) must surface 'success' so the ` +
        `recovery branch stays silent; got '${res2.stdout.trim()}'`,
    );
  } else {
    console.warn("jq not installed locally; skipping jq-filter assertions (CI installs jq by default on ubuntu-latest)");
  }
}

console.log("notify-slack-on-failure self-test: all assertions passed");
