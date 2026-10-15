import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/market-data";

export async function GET(request: Request) {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";

  try {
    const data = await getMarketData(forceRefresh);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Yahoo Finance is temporarily unavailable. Try again shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}