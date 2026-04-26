#!/usr/bin/env node
// Quick self-test: writes a temp file with a slack hook URL and runs the
// guardrail script against just that file path; asserts non-zero exit.
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const here = fileURLToPath(new URL(".", import.meta.url));
const guardrail = join(here, "check-paging-url-leaks.mjs");

const dir = mkdtempSync(join(tmpdir(), "paging-leak-test-"));
const target = join(dir, "leaky.ts");
writeFileSync(
  target,
  [
    "// real-looking slack webhook url",
    "const SLACK = \"https://hooks.slack.com/services/T01ABCDEFG/B02HIJKLMN/abcdefghijklmnopqrstuv01\";",
    "fetch(SLACK);",
  ].join("\n"),
);

// Re-run the guardrail with cwd set to the temp dir, after `git init` so
// `git ls-files` finds our test file. Otherwise nothing is tracked.
spawnSync("git", ["init", "-q"], { cwd: dir });
spawnSync("git", ["add", "."], { cwd: dir });
const result = spawnSync("node", [guardrail], { cwd: dir, encoding: "utf8" });
assert.notEqual(result.status, 0, `expected non-zero exit; stdout=${result.stdout} stderr=${result.stderr}`);
assert.match(result.stderr, /slack-webhook/);
console.log("guardrail self-test: OK");
