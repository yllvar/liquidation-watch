interface MarketData {
  totalOI: number
  dailyVolume: number
  fearGreedIndex: number
  marketTrend: "bullish" | "bearish" | "neutral"
  dominanceData: Array<{
    name: string
    dominance: number
  }>
}

interface APIConfig {
  timeout: number
  retries: number
}

export class ProductionMarketInfoService {
  private static readonly API_CONFIG: APIConfig = {
    timeout: 10000,
    retries: 2,
  }

  private static readonly FALLBACK_DATA: MarketData = {
    totalOI: 12.5, // $12.5B fallback
    dailyVolume: 85.2, // $85.2B fallback
    fearGreedIndex: 50, // Neutral fallback
    marketTrend: "neutral",
    dominanceData: [
      { name: "Bitcoin", dominance: 58.2 },
      { name: "Ethereum", dominance: 12.8 },
      { name: "Tether", dominance: 4.1 },
      { name: "BNB", dominance: 3.2 },
      { name: "Solana", dominance: 2.9 },
      { name: "XRP", dominance: 2.1 },
      { name: "USDC", dominance: 1.8 },
    ],
  }

  static async getMarketData(): Promise<MarketData> {
    console.log("🔄 Phase 2: Fetching fresh market data from multiple sources...")

    const dataFetchers = [this.fetchCoinGeckoData(), this.fetchBinanceVolumeData(), this.fetchFearGreedIndex()]

    const results = await Promise.allSettled(dataFetchers)

    let coinGeckoData: any = null
    let binanceVolume = 0
    let fearGreedIndex: number = this.FALLBACK_DATA.fearGreedIndex

    // Process CoinGecko data
    if (results[0].status === "fulfilled") {
      coinGeckoData = results[0].value
      console.log("✅ Phase 2: CoinGecko global data fetched successfully")
    } else {
      console.error("❌ Phase 2: CoinGecko data failed:", results[0].reason)
      console.log("🔄 Phase 2: Using fallback market data")
    }

    // Process Binance volume data
    if (results[1].status === "fulfilled") {
      binanceVolume = results[1].value
      console.log("✅ Phase 2: Binance volume data fetched successfully")
    } else {
      console.error("❌ Phase 2: Binance volume data failed:", results[1].reason)
      console.log("🔄 Phase 2: Using fallback volume data")
    }

    // Process Fear & Greed Index
    if (results[2].status === "fulfilled") {
      fearGreedIndex = results[2].value
      console.log(`✅ Phase 2: Fear & Greed Index fetched successfully: ${fearGreedIndex}`)
    } else {
      console.error("❌ Phase 2: Fear & Greed Index failed:", results[2].reason)
      console.log("🔄 Phase 2: Using fallback Fear & Greed Index")
    }

    // Compile market data with fallbacks
    const marketData: MarketData = {
      totalOI: coinGeckoData?.data?.total_market_cap?.usd
        ? Math.round(coinGeckoData.data.total_market_cap.usd / 1e11) / 10
        : this.FALLBACK_DATA.totalOI,

      dailyVolume: binanceVolume > 0 ? binanceVolume : this.FALLBACK_DATA.dailyVolume,

      fearGreedIndex,

      marketTrend: fearGreedIndex > 60 ? "bullish" : fearGreedIndex < 40 ? "bearish" : "neutral",

      dominanceData: coinGeckoData?.data?.market_cap_percentage
        ? Object.entries(coinGeckoData.data.market_cap_percentage)
            .slice(0, 7)
            .map(([key, value]: [string, any]) => ({
              name: key.toUpperCase(),
              dominance: Math.round(value * 100) / 100,
            }))
        : this.FALLBACK_DATA.dominanceData,
    }

    console.log(`📊 Phase 2: Market data compiled successfully:`, {
      totalOI: marketData.totalOI,
      dailyVolume: marketData.dailyVolume,
      fearGreedIndex: marketData.fearGreedIndex,
      marketTrend: marketData.marketTrend,
      dominanceCoins: marketData.dominanceData.length,
    })

    return marketData
  }

  private static async fetchWithRetry<T>(fetchFn: () => Promise<T>, serviceName: string, maxRetries = 2): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fetchFn()
      } catch (error) {
        lastError = error as Error

        if (attempt <= maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          console.log(`⚠️ Phase 2: ${serviceName} attempt ${attempt} failed, retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  private static async fetchCoinGeckoData(): Promise<any> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching CoinGecko global data...")

      const response = await fetch("https://api.coingecko.com/api/v3/global", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.API_CONFIG.timeout),
      })

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    }, "CoinGecko")
  }

  private static async fetchBinanceVolumeData(): Promise<number> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching Binance 24h volume data...")

      const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.API_CONFIG.timeout),
      })

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      const totalVolume = data
        .filter((ticker: any) => ticker.symbol.endsWith("USDT"))
        .reduce((sum: number, ticker: any) => sum + Number.parseFloat(ticker.quoteVolume || 0), 0)

      return Math.round((totalVolume / 1e9) * 100) / 100 // Convert to billions
    }, "Binance Volume")
  }

  private static async fetchFearGreedIndex(): Promise<number> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching Fear & Greed Index...")

      const response = await fetch("https://api.alternative.me/fng/", {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.API_CONFIG.timeout),
      })

      if (!response.ok) {
        throw new Error(`Fear & Greed API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data?.[0]?.value) {
        throw new Error("Invalid Fear & Greed API response format")
      }

      const index = Number.parseInt(data.data[0].value)
      console.log(`📊 Phase 2: Fear & Greed Index: ${index} (${this.getFearGreedLabel(index)})`)

      return index
    }, "Fear & Greed Index")
  }

  private static getFearGreedLabel(index: number): string {
    if (index >= 75) return "Extreme Greed"
    if (index >= 55) return "Greed"
    if (index >= 45) return "Neutral"
    if (index >= 25) return "Fear"
    return "Extreme Fear"
  }
}
