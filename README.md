# Porto Market Heatmap

A responsive market heatmap for a curated set of US equities, Indonesian IDX listings, and major cryptocurrency pairs. Tile color reflects the selected period return; the arrow and session count show the current streak of completed daily closes.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app fetches market data from a server-side Next.js route and refreshes automatically every 90 seconds. Use the refresh button to request new quotes immediately.

## Controls

- Select `1D`, `1W`, or `1M` to change the percentage return shown on tiles.
- Toggle `US`, `ID`, or `Crypto` to filter market groups.
- Search by ticker or company name, or choose a sort order.
- Select a tile to see its price, quote time, selected-period return, and current streak.

The editable starter universe is in `src/lib/symbols.ts`.

## Data notes

This app uses `yahoo-finance2` on the server; Yahoo requests are not made from the browser. The integration is an unofficial community client, not an official Yahoo Finance API. Yahoo may change or limit its endpoints, symbols may be unavailable, and returned quotes may be delayed. This dashboard is for informational/personal use, not trading or commercial market-data distribution. Review Yahoo's current data terms before relying on it.

The starter list uses Yahoo `.JK` symbols for Indonesia and USD pairs for crypto. Return windows use daily closes: `1W` uses five sessions and `1M` uses 21 sessions. Streaks count consecutive completed daily closes moving in the same direction; a flat or missing close ends the streak. Current/incomplete daily candles are excluded from streaks.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```
