import { NextResponse } from "next/server"
import { ProductionMarketInfoService } from "@/lib/services/production-market-info-service"

export async function GET() {
  try {
    console.log("🚀 Phase 2: Fetching REAL market data from multiple sources...")

    const startTime = Date.now()
    const marketData = await ProductionMarketInfoService.getMarketData()
    const responseTime = Date.now() - startTime

    console.log("✅ Phase 2: Successfully fetched real market data:", {
      totalOI: marketData.totalOI,
      dailyVolume: marketData.dailyVolume,
      fearGreedIndex: marketData.fearGreedIndex,
      dominanceCoins: marketData.dominanceData.length,
      responseTime: `${responseTime}ms`,
    })

    return NextResponse.json({
      success: true,
      marketData,
      timestamp: new Date().toISOString(),
      responseTime,
      dataSources: {
        coinGecko: "Global market data & dominance",
        binance: "24h trading volume",
        fearGreed: "Market sentiment index",
      },
      phase: "Phase 2 - Real Data",
    })
  } catch (error) {
    console.error("❌ Phase 2: Error fetching market data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch market data",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        phase: "Phase 2 - Real Data",
      },
      { status: 500 },
    )
  }
}

// Cache for 5 minutes in production
export const revalidate = 300
