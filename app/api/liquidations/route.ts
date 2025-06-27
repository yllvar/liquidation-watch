import { type NextRequest, NextResponse } from "next/server"
import { LiquidationService } from "@/lib/services/liquidation-service"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const exchange = searchParams.get("exchange")
  const symbol = searchParams.get("symbol")
  const limit = Number.parseInt(searchParams.get("limit") || "100")

  try {
    const liquidations = await LiquidationService.getLiquidations({
      exchange: exchange as any,
      symbol,
      limit,
    })

    return NextResponse.json({ liquidations })
  } catch (error) {
    console.error("Error fetching liquidations:", error)
    return NextResponse.json({ error: "Failed to fetch liquidations" }, { status: 500 })
  }
}
