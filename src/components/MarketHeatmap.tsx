"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  Database,
  LoaderCircle,
  Minus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { MarketAsset, MarketPayload } from "@/lib/market-data";
import type { MarketDirection, MarketRange } from "@/lib/heatmap";
import { MARKET_GROUPS, type MarketGroupId } from "@/lib/symbols";

type SortMode = "change" | "gainers" | "losers" | "ticker";

async function requestMarketData(forceRefresh = false): Promise<MarketPayload> {
  const response = await fetch(`/api/heatmap${forceRefresh ? "?refresh=1" : ""}`, {
    cache: "no-store",
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Market data could not be loaded.");
  return body as MarketPayload;
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const roundedValue = Math.abs(value) < 0.005 ? 0 : value;
  const prefix = roundedValue > 0 ? "+" : "";
  return `${prefix}${roundedValue.toFixed(2)}%`;
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null || !Number.isFinite(price)) return "Quote unavailable";
  const fractionDigits = currency === "IDR" ? 0 : price < 1 ? 5 : price < 100 ? 3 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: fractionDigits,
  }).format(price);
}

function formatTilePrice(price: number | null, currency: string): string {
  if (price === null || !Number.isFinite(price)) return "No live quote";
  if (currency === "IDR") {
    return `Rp${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(price)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: price < 1 ? 4 : 2,
  }).format(price);
}

function formatTime(value: string | null | undefined): string {
  if (!value) return "No quote time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No quote time";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function directionClass(direction: MarketDirection): string {
  return direction === "up" ? "text-up" : direction === "down" ? "text-down" : "text-flat";
}

function tileTone(asset: MarketAsset, range: MarketRange): string {
  const metric = asset.metrics[range];
  if (asset.error || metric.direction === "flat" || metric.intensity === 0) return "tile--flat";
  return `tile--${metric.direction}-${metric.intensity}`;
}

function sortAssets(assets: MarketAsset[], mode: SortMode, range: MarketRange): MarketAsset[] {
  return [...assets].sort((left, right) => {
    const leftChange = left.metrics[range].changePercent;
    const rightChange = right.metrics[range].changePercent;
    if (mode === "ticker") return left.symbol.localeCompare(right.symbol);
    if (leftChange === null) return 1;
    if (rightChange === null) return -1;
    if (mode === "change") return Math.abs(rightChange) - Math.abs(leftChange);
    if (mode === "losers") return leftChange - rightChange;
    return rightChange - leftChange;
  });
}

function MarketTile({
  asset,
  range,
  onOpen,
}: {
  asset: MarketAsset;
  range: MarketRange;
  onOpen: (asset: MarketAsset) => void;
}) {
  const metric = asset.metrics[range];
  const StreakIcon = metric.streakDirection === "up"
    ? ArrowUpRight
    : metric.streakDirection === "down"
      ? ArrowDownRight
      : Minus;

  return (
    <button
      className={`market-tile ${tileTone(asset, range)}`}
      type="button"
      onClick={() => onOpen(asset)}
      title={`${asset.name} · ${formatPrice(asset.price, asset.currency)} · ${formatPercent(metric.changePercent)} over ${range}`}
      aria-label={`${asset.name}, ${asset.symbol}, ${formatPercent(metric.changePercent)} over ${range}, ${metric.streak} day ${metric.streakDirection} streak`}
    >
      <span className="tile-topline">
        <span className="tile-symbol">{asset.symbol.replace("-USD", "")}</span>
        <span className="tile-market-label">{asset.group === "indonesia" ? "IDX" : asset.group === "crypto" ? "CRYPTO" : "US"}</span>
      </span>
      <span className="tile-main">
        <span className="tile-change-row">
          {metric.direction === "up" ? <ArrowUpRight size={14} /> : metric.direction === "down" ? <ArrowDownRight size={14} /> : <Minus size={13} />}
          <span className="tile-percent">{formatPercent(metric.changePercent)}</span>
        </span>
        <span className="tile-price">{formatTilePrice(asset.price, asset.currency)}</span>
      </span>
      <span className="tile-footer">
        <span className="tile-name">{asset.name}</span>
        <span className={`tile-streak tile-streak--${metric.streakDirection}`}>
          <StreakIcon size={11} />
          {metric.streak > 0 ? `${metric.streak}d` : "flat"}
        </span>
      </span>
      {asset.error && <span className="tile-unavailable">quote unavailable</span>}
    </button>
  );
}

function AssetDetails({
  asset,
  range,
  onClose,
}: {
  asset: MarketAsset;
  range: MarketRange;
  onClose: () => void;
}) {
  const metric = asset.metrics[range];
  const streakLabel = metric.streak === 0
    ? "No active streak"
    : `${metric.streak} ${metric.streak === 1 ? "session" : "sessions"} ${metric.streakDirection}`;

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <section
        className="detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-topline">
          <div>
            <p className="modal-symbol">{asset.symbol} · {asset.group.toUpperCase()}</p>
            <h2 className="modal-title" id="asset-detail-title">{asset.name}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close details">
            <X size={16} />
          </button>
        </div>
        <p className="modal-price">{formatPrice(asset.price, asset.currency)}</p>
        <p className="modal-updated">Last quote {formatTime(asset.updatedAt)}</p>
        <div className="modal-metrics">
          <div className="modal-metric">
            <span>{range} RETURN</span>
            <strong className={directionClass(metric.direction)}>{formatPercent(metric.changePercent)}</strong>
          </div>
          <div className="modal-metric">
            <span>CURRENT STREAK</span>
            <strong className={directionClass(metric.streakDirection)}>{streakLabel}</strong>
          </div>
        </div>
        {asset.error && <div className="modal-error">Yahoo Finance did not return a quote for this symbol: {asset.error}</div>}
      </section>
    </div>
  );
}

export default function MarketHeatmap() {
  const [payload, setPayload] = useState<MarketPayload | null>(null);
  const [range, setRange] = useState<MarketRange>("1D");
  const [enabledGroups, setEnabledGroups] = useState<Set<MarketGroupId>>(
    () => new Set(["us", "indonesia", "crypto"]),
  );
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("change");
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadMarketData(background = false) {
      if (!background) {
        setIsLoading(true);
        setIsRefreshing(true);
      }
      try {
        const data = await requestMarketData();
        if (!isActive) return;
        setPayload(data);
        setLoadError(null);
      } catch (error) {
        if (!isActive) return;
        setLoadError(error instanceof Error ? error.message : "Market data could not be loaded.");
      } finally {
        if (isActive && !background) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadMarketData();
    const interval = window.setInterval(() => void loadMarketData(true), 90_000);
    return () => {
      isActive = false;
      window.clearInterval(interval);
    };
  }, []);

  async function refreshMarketData() {
    setIsRefreshing(true);
    try {
      const data = await requestMarketData(true);
      setPayload(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Market data could not be loaded.");
    } finally {
      setIsRefreshing(false);
    }
  }

  function toggleGroup(group: MarketGroupId) {
    setEnabledGroups((current) => {
      const next = new Set(current);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  const allAssets = payload?.assets ?? [];
  const matchingAssets = allAssets.filter((asset) => {
    if (!enabledGroups.has(asset.group)) return false;
    if (!query.trim()) return true;
    const search = query.trim().toLowerCase();
    return asset.symbol.toLowerCase().includes(search) || asset.name.toLowerCase().includes(search);
  });
  const groupAssets = MARKET_GROUPS.map((group) => ({
    ...group,
    assets: sortAssets(matchingAssets.filter((asset) => asset.group === group.id), sortMode, range),
  })).filter((group) => group.assets.length > 0);
  const liveQuotes = matchingAssets.filter((asset) => !asset.error && asset.price !== null).length;

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark"><Activity size={18} strokeWidth={2.1} /></span>
          <div>
            <p className="brand-name">PORTO / MARKETS</p>
            <p className="brand-caption">GLOBAL EQUITIES + DIGITAL ASSETS</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="source-indicator"><Database size={13} /> YAHOO FINANCE</span>
          <span className="updated-label">
            <span className="status-dot" />
            {payload ? `Updated ${formatTime(payload.updatedAt)}` : "Connecting to markets"}
          </span>
          <button
            className="refresh-button"
            type="button"
            title="Refresh market data"
            aria-label="Refresh market data"
            disabled={isRefreshing}
            onClick={() => void refreshMarketData()}
          >
            <RefreshCw size={15} className={isRefreshing ? "spinning" : undefined} />
          </button>
        </div>
      </header>

      <section className="page-intro">
        <div>
          <p className="eyebrow">LIVE BOARD · US / JAKARTA / UTC</p>
          <h1 className="page-title">Market heatmap</h1>
          <p className="page-subtitle">A live read on momentum across US equities, Indonesia, and crypto.</p>
        </div>
        <div className="intro-side-note"><Clock3 size={14} /> Streaks count completed daily closes</div>
      </section>

      <section className="controls-panel" aria-label="Heatmap controls">
        <div className="control-left">
          <span className="control-label">PERFORMANCE</span>
          <div className="range-switch" aria-label="Performance period">
            {(["1D", "1W", "1M"] as MarketRange[]).map((option) => (
              <button
                className="range-button"
                type="button"
                key={option}
                aria-pressed={range === option}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="filter-switch" aria-label="Filter market groups">
            {MARKET_GROUPS.map((group) => (
              <button
                className="filter-button"
                type="button"
                key={group.id}
                aria-pressed={enabledGroups.has(group.id)}
                onClick={() => toggleGroup(group.id)}
              >
                {group.id === "us" ? "US" : group.id === "indonesia" ? "ID" : "Crypto"}
              </button>
            ))}
          </div>
        </div>
        <div className="control-right">
          <label className="search-box">
            <Search size={14} />
            <input
              aria-label="Search ticker or company"
              placeholder="Search markets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="sort-control">
            <span className="control-label">SORT</span>
            <select aria-label="Sort assets" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="change">Biggest moves</option>
              <option value="gainers">Top gainers</option>
              <option value="losers">Top losers</option>
              <option value="ticker">Ticker</option>
            </select>
          </label>
        </div>
      </section>

      <div className="legend-row">
        <span className="result-count">
          <strong>{liveQuotes}</strong> live quotes · <strong>{matchingAssets.length}</strong> assets shown
          {payload && payload.failedSymbols > 0 && <span> · {payload.failedSymbols} unavailable</span>}
        </span>
        <div className="color-legend" aria-label="Color legend, lighter to darker means smaller to larger change">
          <span>LOSS</span>
          <span className="legend-ramp" aria-hidden="true">
            <i className="legend-swatch legend-down-1" /><i className="legend-swatch legend-down-2" />
            <i className="legend-swatch legend-down-3" /><i className="legend-swatch legend-down-4" />
          </span>
          <span>FLAT</span>
          <span className="legend-ramp" aria-hidden="true">
            <i className="legend-swatch legend-up-1" /><i className="legend-swatch legend-up-2" />
            <i className="legend-swatch legend-up-3" /><i className="legend-swatch legend-up-4" />
          </span>
          <span>GAIN</span>
        </div>
      </div>

      {loadError && (
        <div className="error-banner" role="alert">
          <span>{loadError}</span>
          <button type="button" onClick={() => void refreshMarketData()}>Retry</button>
        </div>
      )}

      {isLoading && !payload ? (
        <div className="loading-state"><span><LoaderCircle className="spinning" size={17} /> Loading market quotes</span></div>
      ) : groupAssets.length > 0 ? (
        <div className="board-list">
          {groupAssets.map((group) => (
            <section className="market-group" key={group.id} aria-label={`${group.label} heatmap`}>
              <header className="group-heading">
                <div className="group-title">
                  <span className="group-symbol">{group.id === "us" ? "US" : group.id === "indonesia" ? "ID" : "₿"}</span>
                  <div>
                    <h2>{group.label}</h2>
                    <p className="group-subtitle">{group.exchange} · {group.currency}</p>
                  </div>
                </div>
                <span className="group-total">{group.assets.length} ASSETS</span>
              </header>
              <div className="tile-grid">
                {group.assets.map((asset) => (
                  <MarketTile key={asset.symbol} asset={asset} range={range} onOpen={setSelectedAsset} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No assets match these filters</strong>
          Try another ticker or enable a market group.
        </div>
      )}

      <footer className="data-footnote">
        <span>COLOR = {range} PRICE CHANGE · TILE LABEL = CONSECUTIVE CLOSED-SESSION STREAK</span>
        <span>Data via Yahoo Finance · For informational use</span>
      </footer>

      {selectedAsset && <AssetDetails asset={selectedAsset} range={range} onClose={() => setSelectedAsset(null)} />}
    </main>
  );
}
