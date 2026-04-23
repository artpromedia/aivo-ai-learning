import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SPEECH_BUDDY_MODE_ID,
  type StartSessionInput,
  type TurnInput,
} from "../src/modes/speechBuddy.js";

describe("tutor-svc speech buddy mode scaffold", () => {
  it("exports a stable mode id", () => {
    assert.equal(SPEECH_BUDDY_MODE_ID, "speech_buddy");
  });

  it("StartSessionInput requires consentRecordId at the type level (smoke check)", () => {
    const input: StartSessionInput = {
      tenantId: "t1",
      learnerId: "l1",
      ageBand: "6-9",
      locale: "en",
      consentRecordId: "c1",
    };
    assert.equal(input.consentRecordId, "c1");
  });

  it("TurnInput exposes the post-PII-scrub child utterance field", () => {
    const t: TurnInput = { sessionId: "s1", childUtterance: "hi" };
    assert.equal(t.childUtterance, "hi");
  });
});
