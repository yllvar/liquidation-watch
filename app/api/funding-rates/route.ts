import { NextResponse } from "next/server"
import { ProductionFundingRateService } from "@/lib/services/production-funding-rate-service"

export async function GET() {
  try {
    console.log("🚀 Phase 2: Fetching REAL funding rates from all exchanges...")

    const targetCoins = [
      "BTC",
      "ETH",
      "SOL",
      "LTC",
      "XRP",
      "BNB",
      "DOGE",
      "ADA",
      "SUI",
      "AVAX",
      "DOT",
      "LINK",
      "MATIC",
      "UNI",
      "ATOM",
    ]
    const startTime = Date.now()

    const fundingRates = await ProductionFundingRateService.fetchFundingRates(targetCoins)
    const responseTime = Date.now() - startTime

    console.log(`✅ Phase 2: Successfully fetched ${fundingRates.length} funding rates in ${responseTime}ms`)

    // Group by exchange for better organization
    const exchangeBreakdown = fundingRates.reduce(
      (acc, rate) => {
        acc[rate.exchange] = (acc[rate.exchange] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return NextResponse.json({
      success: true,
      fundingRates,
      timestamp: new Date().toISOString(),
      totalRates: fundingRates.length,
      exchanges: Object.keys(exchangeBreakdown),
      exchangeBreakdown,
      responseTime,
      targetCoins: targetCoins.length,
      phase: "Phase 2 - Real Data",
    })
  } catch (error) {
    console.error("❌ Phase 2: Error fetching funding rates:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch funding rates",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        phase: "Phase 2 - Real Data",
      },
      { status: 500 },
    )
  }
}

// Cache for 2 minutes in production
export const revalidate = 120
