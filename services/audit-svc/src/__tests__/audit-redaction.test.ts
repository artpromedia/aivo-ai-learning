import { describe, expect, it } from "vitest";
import { redactAuditMetadata } from "../services/audit-redaction.js";

describe("redactAuditMetadata", () => {
  it("redacts top-level sensitive keys", () => {
    const result = redactAuditMetadata({
      parentPrivateNotes: "private",
      iepText: "long IEP",
      learnerName: "Alex",
    });
    expect(result.parentPrivateNotes).toBe("[redacted]");
    expect(result.iepText).toBe("[redacted]");
    expect(result.learnerName).toBe("Alex");
  });

  it("redacts nested sensitive keys", () => {
    const result = redactAuditMetadata({
      details: { medicalNotes: "diagnosis", visible: true },
    });
    const details = result.details as Record<string, unknown>;
    expect(details.medicalNotes).toBe("[redacted]");
    expect(details.visible).toBe(true);
  });

  it("redacts secrets and tokens", () => {
    const result = redactAuditMetadata({
      apiKey: "sk-abc",
      token: "tok-xyz",
      password: "shh",
    });
    expect(result.apiKey).toBe("[redacted]");
    expect(result.token).toBe("[redacted]");
    expect(result.password).toBe("[redacted]");
  });

  it("truncates very long values", () => {
    const long = "x".repeat(500);
    const result = redactAuditMetadata({ note: long });
    expect((result.note as string).length).toBeLessThanOrEqual(241);
    expect((result.note as string).endsWith("…")).toBe(true);
  });
});
