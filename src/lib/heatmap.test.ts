import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateReturn,
  calculateStreak,
  getChangeIntensity,
  type DailyCandle,
} from "./heatmap";

function candles(closes: Array<number | null>): DailyCandle[] {
  return closes.map((close, index) => ({
    date: new Date(Date.UTC(2026, 0, index + 1)),
    close,
  }));
}

test("returns are measured from the correct completed-session baseline", () => {
  const history = candles([100, 102, 103, 104, 105, 110]);

  assert.ok(Math.abs(calculateReturn(history, 111, "1D")! - (111 / 110 - 1) * 100) < 1e-10);
  assert.ok(Math.abs(calculateReturn(history, 111, "1W")! - (111 / 100 - 1) * 100) < 1e-10);
  assert.ok(Math.abs(calculateReturn(history, 110, "1D", 1)! - (110 / 105 - 1) * 100) < 1e-10);
});

test("longer ranges return null when there is not enough history", () => {
  assert.equal(calculateReturn(candles([100, 102]), 103, "1M"), null);
});

test("counts consecutive rises and falls, stopping when direction changes", () => {
  assert.deepEqual(calculateStreak(candles([10, 11, 12, 11, 10])), {
    count: 2,
    direction: "down",
  });
  assert.deepEqual(calculateStreak(candles([10, 11, 12, 13])), {
    count: 3,
    direction: "up",
  });
});

test("flat and missing closes terminate a streak", () => {
  assert.deepEqual(calculateStreak(candles([10, 11, 11, 12])), {
    count: 1,
    direction: "up",
  });
  assert.deepEqual(calculateStreak(candles([10, 11, null, 12])), {
    count: 0,
    direction: "flat",
  });
});

test("near-zero and missing changes stay neutral", () => {
  assert.deepEqual(getChangeIntensity(null), { direction: "flat", intensity: 0 });
  assert.deepEqual(getChangeIntensity(0.03), { direction: "flat", intensity: 0 });
  assert.deepEqual(getChangeIntensity(-2), { direction: "down", intensity: 3 });
  assert.deepEqual(getChangeIntensity(6), { direction: "up", intensity: 4 });
});