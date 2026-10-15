export type MarketRange = "1D" | "1W" | "1M";
export type MarketDirection = "up" | "down" | "flat";

export interface DailyCandle {
  date: Date;
  close: number | null;
}

export interface HeatmapMetrics {
  changePercent: number | null;
  direction: MarketDirection;
  intensity: 0 | 1 | 2 | 3 | 4;
  streak: number;
  streakDirection: MarketDirection;
  streakChangePercent: number | null;
  streakIntensity: 0 | 1 | 2 | 3 | 4;
}

const RANGE_SESSIONS: Record<MarketRange, number> = {
  "1D": 0,
  "1W": 5,
  "1M": 21,
};

export function calculateReturn(
  candles: DailyCandle[],
  currentPrice: number,
  range: MarketRange,
  oneDayBaselineAdjustment = 0,
): number | null {
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) return null;

  const baselineIndex = candles.length - 1 - RANGE_SESSIONS[range] - (range === "1D" ? oneDayBaselineAdjustment : 0);
  const baseline = candles[baselineIndex]?.close;
  if (typeof baseline !== "number" || !Number.isFinite(baseline) || baseline <= 0) {
    return null;
  }

  return ((currentPrice - baseline) / baseline) * 100;
}

export function calculateStreak(candles: DailyCandle[]): {
  count: number;
  direction: MarketDirection;
  changePercent: number | null;
} {
  if (candles.length < 2) return { count: 0, direction: "flat", changePercent: null };

  const newest = candles[candles.length - 1].close;
  const previous = candles[candles.length - 2].close;
  if (typeof newest !== "number" || typeof previous !== "number") {
    return { count: 0, direction: "flat", changePercent: null };
  }

  const firstMove = Math.sign(newest - previous);
  if (firstMove === 0) return { count: 0, direction: "flat", changePercent: null };

  let count = 0;
  for (let index = candles.length - 1; index > 0; index -= 1) {
    const close = candles[index].close;
    const priorClose = candles[index - 1].close;
    if (typeof close !== "number" || typeof priorClose !== "number") break;
    if (Math.sign(close - priorClose) !== firstMove) break;
    count += 1;
  }

  const baseline = candles[candles.length - count - 1]?.close;
  const changePercent = typeof baseline === "number" && baseline > 0
    ? ((newest - baseline) / baseline) * 100
    : null;

  return {
    count,
    direction: firstMove > 0 ? "up" : "down",
    changePercent,
  };
}

export function getChangeIntensity(changePercent: number | null): {
  direction: MarketDirection;
  intensity: 0 | 1 | 2 | 3 | 4;
} {
  if (changePercent === null || !Number.isFinite(changePercent) || Math.abs(changePercent) < 0.05) {
    return { direction: "flat", intensity: 0 };
  }

  const magnitude = Math.abs(changePercent);
  const intensity = magnitude < 0.5 ? 1 : magnitude < 1.5 ? 2 : magnitude < 3.5 ? 3 : 4;

  return {
    direction: changePercent > 0 ? "up" : "down",
    intensity,
  };
}

export function calculateMetrics(
  candles: DailyCandle[],
  currentPrice: number,
  range: MarketRange,
  streakCandles: DailyCandle[] = candles,
  oneDayBaselineAdjustment = 0,
): HeatmapMetrics {
  const changePercent = calculateReturn(candles, currentPrice, range, oneDayBaselineAdjustment);
  const intensity = getChangeIntensity(changePercent);
  const streak = calculateStreak(streakCandles);
  const streakIntensity = getChangeIntensity(streak.changePercent);

  return {
    changePercent,
    direction: intensity.direction,
    intensity: intensity.intensity,
    streak: streak.count,
    streakDirection: streak.direction,
    streakChangePercent: streak.changePercent,
    streakIntensity: streakIntensity.intensity,
  };
}