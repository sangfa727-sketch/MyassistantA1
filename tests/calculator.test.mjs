import test from "node:test";
import assert from "node:assert/strict";
import { calculateArithmeticExpression as calculate } from "../lib/calculator.mjs";

test("respects operator precedence and parentheses", () => {
  assert.equal(calculate("2 + 3 * 4"), 14);
  assert.equal(calculate("(2 + 3) * 4"), 20);
});

test("supports unary signs, decimals, division and modulo", () => {
  assert.equal(calculate("-2 + +3"), 1);
  assert.equal(calculate("(7.5 - 2.5) / 2"), 2.5);
  assert.equal(calculate("17 % 5"), 2);
});

test("rejects division and modulo by zero", () => {
  assert.throws(() => calculate("1 / 0"), /zero/i);
  assert.throws(() => calculate("1 % 0"), /zero/i);
});

test("rejects code, unsupported operators and malformed syntax", () => {
  for (const input of ["process.exit()", "1 ** 2", "2 ^ 3", "1e3", "1 +", "(1 + 2", "1..2", "()", ""]) {
    assert.throws(() => calculate(input), undefined, input);
  }
});

test("bounds input size, token count and nesting", () => {
  assert.throws(() => calculate("1".repeat(201)), /too long/i);
  assert.throws(() => calculate(Array(52).fill("1").join("+")), /too many tokens/i);
  assert.throws(() => calculate("(".repeat(21) + "1" + ")".repeat(21)), /too deep/i);
});

test("rejects scientific notation and unsupported numeric syntax", () => {
  assert.throws(() => calculate("1e3"), /unsupported/i);
  assert.throws(() => calculate("1..2"), /invalid|unexpected/i);
});
