import YahooFinance from "yahoo-finance2";
import {
  calculateMetrics,
  type DailyCandle,
  type HeatmapMetrics,
  type MarketRange,
} from "@/lib/heatmap";
import { SYMBOLS, type MarketGroupId, type SymbolDefinition } from "@/lib/symbols";

const CACHE_TTL_MS = 90_000;
const HISTORY_DAYS = 70;
const yahooFinance = new YahooFinance();

export interface MarketAsset extends SymbolDefinition {
  price: number | null;
  currency: string;
  updatedAt: string | null;
  metrics: Record<MarketRange, HeatmapMetrics>;
  error?: string;
}

export interface MarketPayload {
  assets: MarketAsset[];
  updatedAt: string;
  source: "Yahoo Finance";
  failedSymbols: number;
}

interface CacheEntry {
  expiresAt: number;
  payload: MarketPayload;
}

let cache: CacheEntry | null = null;

function getSessionDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function emptyMetrics(): Record<MarketRange, HeatmapMetrics> {
  const flat = {
    changePercent: null,
    direction: "flat" as const,
    intensity: 0 as const,
    streak: 0,
    streakDirection: "flat" as const,
  };

  return { "1D": flat, "1W": flat, "1M": flat };
}

function failedAsset(definition: SymbolDefinition, error: unknown): MarketAsset {
  return {
    ...definition,
    price: null,
    currency: definition.group === "indonesia" ? "IDR" : "USD",
    updatedAt: null,
    metrics: emptyMetrics(),
    error: error instanceof Error ? error.message : "Quote unavailable",
  };
}

async function fetchAsset(definition: SymbolDefinition, now: Date): Promise<MarketAsset> {
  const historyStart = new Date(now.getTime() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
  const chart = await yahooFinance.chart(definition.symbol, {
    period1: historyStart,
    interval: "1d",
    return: "array",
  });
  const { meta } = chart;
  const timeZone = meta.exchangeTimezoneName || "UTC";
  const regularPeriod = meta.currentTradingPeriod.regular;
  const regularSessionOpen = now >= regularPeriod.start && now < regularPeriod.end;
  const activeSessionDate = getSessionDate(now, timeZone);
  const quoteSessionDate = getSessionDate(meta.regularMarketTime, timeZone);
  const oneDayBaselineAdjustment = quoteSessionDate < activeSessionDate ? 1 : 0;
  const utcDate = now.toISOString().slice(0, 10);

  const chartCandles: DailyCandle[] = chart.quotes
    .filter((quote) => typeof quote.close === "number" && Number.isFinite(quote.close))
    .map((quote) => ({ date: quote.date, close: quote.close }));
  const returnCandles = chartCandles.filter((candle) =>
    definition.group === "crypto"
      ? candle.date.toISOString().slice(0, 10) < utcDate
      : getSessionDate(candle.date, timeZone) < activeSessionDate,
  );
  const streakCandles = chartCandles.filter((candle) => {
    if (definition.group === "crypto") return candle.date.toISOString().slice(0, 10) < utcDate;
    const candleDate = getSessionDate(candle.date, timeZone);
    return candleDate < activeSessionDate || (candleDate === activeSessionDate && !regularSessionOpen && now >= regularPeriod.end);
  });

  const price = Number.isFinite(meta.regularMarketPrice) ? meta.regularMarketPrice : null;
  const metrics = {
    "1D": calculateMetrics(returnCandles, price ?? Number.NaN, "1D", streakCandles, oneDayBaselineAdjustment),
    "1W": calculateMetrics(returnCandles, price ?? Number.NaN, "1W", streakCandles),
    "1M": calculateMetrics(returnCandles, price ?? Number.NaN, "1M", streakCandles),
  };

  return {
    ...definition,
    name: meta.longName || meta.shortName || definition.name,
    price,
    currency: meta.currency || (definition.group === "indonesia" ? "IDR" : "USD"),
    updatedAt: meta.regularMarketTime?.toISOString() ?? null,
    metrics,
  };
}

export async function getMarketData(forceRefresh = false): Promise<MarketPayload> {
  if (!forceRefresh && cache && cache.expiresAt > Date.now()) return cache.payload;

  const now = new Date();
  const assets: MarketAsset[] = [];
  const chunkSize = 4;

  for (let index = 0; index < SYMBOLS.length; index += chunkSize) {
    const chunk = SYMBOLS.slice(index, index + chunkSize);
    const results = await Promise.allSettled(chunk.map((symbol) => fetchAsset(symbol, now)));

    results.forEach((result, resultIndex) => {
      const definition = chunk[resultIndex];
      assets.push(
        result.status === "fulfilled"
          ? result.value
          : failedAsset(definition, result.reason),
      );
    });
  }

  const payload: MarketPayload = {
    assets,
    updatedAt: new Date().toISOString(),
    source: "Yahoo Finance",
    failedSymbols: assets.filter((asset) => asset.error).length,
  };

  cache = { payload, expiresAt: Date.now() + CACHE_TTL_MS };
  return payload;
}

export function getGroupLabel(group: MarketGroupId): string {
  return group === "us" ? "United States" : group === "indonesia" ? "Indonesia" : "Crypto";
}