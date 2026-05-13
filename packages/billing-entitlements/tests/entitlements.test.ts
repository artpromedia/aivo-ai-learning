import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateTutorEntitlement,
  computeEffectiveTutorSkus,
  isTutorIncludedInPlan,
  getTutorSkuForTutorKey,
  getTutorKeyForTutorSku,
  TUTOR_KEY_TO_SKU,
  ALL_TUTOR_SKUS,
  ALL_TUTOR_KEYS,
} from "../src/index.js";

test("tutor key <-> sku round-trips for every tutor", () => {
  for (const key of ALL_TUTOR_KEYS) {
    const sku = getTutorSkuForTutorKey(key);
    assert.equal(getTutorKeyForTutorSku(sku), key);
  }
  assert.equal(ALL_TUTOR_SKUS.length, ALL_TUTOR_KEYS.length);
});

test("free plan includes ELA only", () => {
  assert.ok(isTutorIncludedInPlan("free", "ADDON_TUTOR_ELA"));
  assert.ok(!isTutorIncludedInPlan("free", "ADDON_TUTOR_MATH"));
});

test("single and family include ELA + Math + Science + History", () => {
  for (const plan of ["single", "family"] as const) {
    assert.ok(isTutorIncludedInPlan(plan, "ADDON_TUTOR_ELA"));
    assert.ok(isTutorIncludedInPlan(plan, "ADDON_TUTOR_MATH"));
    assert.ok(isTutorIncludedInPlan(plan, "ADDON_TUTOR_SCIENCE"));
    assert.ok(isTutorIncludedInPlan(plan, "ADDON_TUTOR_HISTORY"));
    assert.ok(!isTutorIncludedInPlan(plan, "ADDON_TUTOR_CODING"));
  }
});

test("district includes every tutor", () => {
  for (const sku of ALL_TUTOR_SKUS) {
    assert.ok(isTutorIncludedInPlan("district", sku), `district should include ${sku}`);
  }
});

test("inactive subscription denies entitlement to included tutor", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "canceled" },
    tutorSubscriptions: [],
    tutorSku: "ADDON_TUTOR_ELA",
  });
  assert.equal(result.entitled, false);
  assert.equal(result.reason, "subscription_inactive");
  assert.equal(result.upgradePath, "renew_subscription");
});

test("missing subscription denies entitlement", () => {
  const result = evaluateTutorEntitlement({
    subscription: null,
    tutorSubscriptions: [],
    tutorSku: "ADDON_TUTOR_ELA",
  });
  assert.equal(result.entitled, false);
  assert.equal(result.reason, "subscription_inactive");
});

test("active plan grants included tutor", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "active" },
    tutorSubscriptions: [],
    tutorSku: "ADDON_TUTOR_MATH",
  });
  assert.equal(result.entitled, true);
  assert.equal(result.reason, "included");
});

test("active plan denies tutor not in plan without add-on", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "active" },
    tutorSubscriptions: [],
    tutorSku: "ADDON_TUTOR_CODING",
  });
  assert.equal(result.entitled, false);
  assert.equal(result.reason, "not_entitled");
  assert.equal(result.upgradePath, "purchase_addon");
});

test("active add-on grants non-included tutor", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "active" },
    tutorSubscriptions: [{ tutorSku: "ADDON_TUTOR_CODING", status: "active" }],
    tutorSku: "ADDON_TUTOR_CODING",
  });
  assert.equal(result.entitled, true);
  assert.equal(result.reason, "purchased");
});

test("grace-period add-on still grants access", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "active" },
    tutorSubscriptions: [{ tutorSku: "ADDON_TUTOR_CODING", status: "grace_period" }],
    tutorSku: "ADDON_TUTOR_CODING",
  });
  assert.equal(result.entitled, true);
  assert.equal(result.reason, "grace_period");
});

test("canceled add-on does not grant access", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "active" },
    tutorSubscriptions: [{ tutorSku: "ADDON_TUTOR_CODING", status: "canceled" }],
    tutorSku: "ADDON_TUTOR_CODING",
  });
  assert.equal(result.entitled, false);
});

test("past_due subscription keeps access during retry window", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "past_due" },
    tutorSubscriptions: [],
    tutorSku: "ADDON_TUTOR_ELA",
  });
  assert.equal(result.entitled, true);
});

test("trialing subscription grants access", () => {
  const result = evaluateTutorEntitlement({
    subscription: { plan: "single", status: "trialing" },
    tutorSubscriptions: [],
    tutorSku: "ADDON_TUTOR_ELA",
  });
  assert.equal(result.entitled, true);
});

test("computeEffectiveTutorSkus merges included + active add-ons", () => {
  const skus = computeEffectiveTutorSkus({
    subscription: { plan: "single", status: "active" },
    tutorSubscriptions: [
      { tutorSku: "ADDON_TUTOR_CODING", status: "active" },
      { tutorSku: "ADDON_TUTOR_ARTS", status: "grace_period" },
      { tutorSku: "ADDON_TUTOR_LANGUAGES", status: "canceled" },
    ],
  });
  // 4 included + 2 active/grace add-ons = 6, canceled excluded
  assert.equal(skus.length, 6);
  assert.ok(skus.includes("ADDON_TUTOR_CODING"));
  assert.ok(skus.includes("ADDON_TUTOR_ARTS"));
  assert.ok(!skus.includes("ADDON_TUTOR_LANGUAGES"));
});

test("computeEffectiveTutorSkus empty when subscription inactive", () => {
  const skus = computeEffectiveTutorSkus({
    subscription: { plan: "single", status: "canceled" },
    tutorSubscriptions: [{ tutorSku: "ADDON_TUTOR_CODING", status: "active" }],
  });
  assert.equal(skus.length, 0);
});

test("district plan effective set includes every tutor", () => {
  const skus = computeEffectiveTutorSkus({
    subscription: { plan: "district", status: "active" },
    tutorSubscriptions: [],
  });
  assert.equal(skus.length, Object.keys(TUTOR_KEY_TO_SKU).length);
});
