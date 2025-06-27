interface MarketData {
  totalOI: number
  dailyVolume: number
  dominanceData: { symbol: string; percentage: number }[]
  marketTrend: "bullish" | "bearish" | "neutral"
  fundingHealth: "positive" | "negative" | "neutral"
  lastUpdated: Date
}

export class MarketInfoService {
  static async getMarketData(): Promise<MarketData> {
    try {
      // In a real implementation, you would fetch from multiple APIs
      // For now, return mock data
      return {
        totalOI: 12.7,
        dailyVolume: 45.3,
        dominanceData: [
          { symbol: "BTC", percentage: 42.3 },
          { symbol: "ETH", percentage: 28.7 },
          { symbol: "SOL", percentage: 8.2 },
          { symbol: "Others", percentage: 20.8 },
        ],
        marketTrend: "neutral",
        fundingHealth: "neutral",
        lastUpdated: new Date(),
      }
    } catch (error) {
      console.error("Error fetching market data:", error)
      throw new Error("Failed to fetch market data")
    }
  }
}
