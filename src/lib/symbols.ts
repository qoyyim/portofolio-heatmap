export type MarketGroupId = "us" | "indonesia" | "crypto";

export interface SymbolDefinition {
  symbol: string;
  name: string;
  group: MarketGroupId;
}

export const MARKET_GROUPS: Array<{
  id: MarketGroupId;
  label: string;
  exchange: string;
  currency: string;
}> = [
  { id: "us", label: "United States", exchange: "NYSE · NASDAQ", currency: "USD" },
  { id: "indonesia", label: "Indonesia", exchange: "IDX · JAKARTA", currency: "IDR" },
  { id: "crypto", label: "Crypto", exchange: "24 / 7 MARKETS", currency: "USD" },
];

export const SYMBOLS: SymbolDefinition[] = [
  { symbol: "NVDA", name: "NVIDIA", group: "us" },
  { symbol: "AAPL", name: "Apple", group: "us" },
  { symbol: "MSFT", name: "Microsoft", group: "us" },
  { symbol: "AMZN", name: "Amazon", group: "us" },
  { symbol: "GOOGL", name: "Alphabet", group: "us" },
  { symbol: "META", name: "Meta Platforms", group: "us" },
  { symbol: "TSLA", name: "Tesla", group: "us" },
  { symbol: "LLY", name: "Eli Lilly", group: "us" },
  { symbol: "JPM", name: "JPMorgan Chase", group: "us" },
  { symbol: "WMT", name: "Walmart", group: "us" },
  { symbol: "AVGO", name: "Broadcom", group: "us" },
  { symbol: "COST", name: "Costco", group: "us" },
  { symbol: "BBCA.JK", name: "Bank Central Asia", group: "indonesia" },
  { symbol: "BBRI.JK", name: "Bank Rakyat Indonesia", group: "indonesia" },
  { symbol: "BMRI.JK", name: "Bank Mandiri", group: "indonesia" },
  { symbol: "BBNI.JK", name: "Bank Negara Indonesia", group: "indonesia" },
  { symbol: "TLKM.JK", name: "Telkom Indonesia", group: "indonesia" },
  { symbol: "ASII.JK", name: "Astra International", group: "indonesia" },
  { symbol: "ANTM.JK", name: "Aneka Tambang", group: "indonesia" },
  { symbol: "GOTO.JK", name: "GoTo Gojek Tokopedia", group: "indonesia" },
  { symbol: "BTC-USD", name: "Bitcoin", group: "crypto" },
  { symbol: "ETH-USD", name: "Ethereum", group: "crypto" },
  { symbol: "SOL-USD", name: "Solana", group: "crypto" },
  { symbol: "BNB-USD", name: "BNB", group: "crypto" },
  { symbol: "XRP-USD", name: "XRP", group: "crypto" },
  { symbol: "DOGE-USD", name: "Dogecoin", group: "crypto" },
];