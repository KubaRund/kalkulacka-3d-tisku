import assert from "node:assert/strict";
import test from "node:test";
import { estimate, EXAMPLE, parseNumber } from "../dist/calc.js";

test("example gives separate material, energy and reserve costs", () => {
  const { errors, totals } = estimate(EXAMPLE);
  const fixed = (value) => value.toFixed(2);
  assert.deepEqual(errors, {});
  assert.equal(totals.batchGrams, 152);
  assert.equal(totals.batchMinutes, 380);
  assert.equal(fixed(totals.filamentCost), "94.24");
  assert.equal(fixed(totals.energyCost), "3.61");
  assert.equal(fixed(totals.reserveCost), "7.54");
  assert.equal(fixed(totals.batchCost), "105.39");
  assert.equal(fixed(totals.unitCost), "26.35");
});

test("total input for a shared build plate is divided by quantity only once", () => {
  const { totals } = estimate({ ...EXAMPLE, scope: "batch", reserve: "0", wear: "12" });
  assert.equal(totals.batchGrams, 38);
  assert.equal(totals.batchMinutes, 95);
  assert.equal(totals.wearCost, 19);
  assert.equal(totals.unitCost, totals.batchCost / 4);
});

test("parses a Czech decimal and spaced thousands", () => {
  assert.equal(parseNumber("1\u00a0250,50"), 1250.5);
  assert.equal(parseNumber("0.5"), 0.5);
  assert.ok(Number.isNaN(parseNumber("8,9.1")));
  assert.ok(Number.isNaN(parseNumber("")));
});

test("reports undefined rates and invalid piece and minute counts", () => {
  const { errors, totals } = estimate({ ...EXAMPLE, spoolGrams: "0", quantity: "2,5", minutes: "60", grams: "-4" });
  assert.deepEqual(Object.keys(errors).sort(), ["grams", "minutes", "quantity", "spoolGrams"]);
  assert.equal(totals, null);
});

test("empty optional fields and zero rates are valid", () => {
  const { totals } = estimate({ ...EXAMPLE, spoolPrice: "0", electricity: "0", reserve: "", wear: "" });
  assert.equal(totals.unitCost, 0);
  assert.equal(totals.batchCost, 0);
});
