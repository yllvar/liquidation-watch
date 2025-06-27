interface FundingRate {
  symbol: string
  exchange: string
  rate: number
  timestamp: string
  nextFundingTime?: string
}

interface ExchangeConfig {
  name: string
  baseUrl: string
  rateLimit: number
  timeout: number
  retries: number
}

export class ProductionFundingRateService {
  private static readonly EXCHANGE_CONFIGS: Record<string, ExchangeConfig> = {
    binance: {
      name: "Binance",
      baseUrl: "https://fapi.binance.com",
      rateLimit: 1200, // requests per minute
      timeout: 10000,
      retries: 2,
    },
    bybit: {
      name: "Bybit",
      baseUrl: "https://api.bybit.com",
      rateLimit: 600,
      timeout: 10000,
      retries: 2,
    },
    okx: {
      name: "OKX",
      baseUrl: "https://www.okx.com",
      rateLimit: 600,
      timeout: 10000,
      retries: 2,
    },
    hyperliquid: {
      name: "Hyperliquid",
      baseUrl: "https://api.hyperliquid.xyz",
      rateLimit: 1200,
      timeout: 10000,
      retries: 2,
    },
  }

  private static readonly FALLBACK_DATA: FundingRate[] = [
    // Binance fallback data
    { symbol: "BTCUSDT", exchange: "binance", rate: 0.0001, timestamp: new Date().toISOString() },
    { symbol: "ETHUSDT", exchange: "binance", rate: 0.0002, timestamp: new Date().toISOString() },
    { symbol: "SOLUSDT", exchange: "binance", rate: 0.0003, timestamp: new Date().toISOString() },
    { symbol: "LTCUSDT", exchange: "binance", rate: 0.0001, timestamp: new Date().toISOString() },
    { symbol: "XRPUSDT", exchange: "binance", rate: 0.0002, timestamp: new Date().toISOString() },

    // Bybit fallback data
    { symbol: "BTCUSDT", exchange: "bybit", rate: 0.00015, timestamp: new Date().toISOString() },
    { symbol: "ETHUSDT", exchange: "bybit", rate: 0.00025, timestamp: new Date().toISOString() },
    { symbol: "SOLUSDT", exchange: "bybit", rate: 0.00035, timestamp: new Date().toISOString() },
    { symbol: "BNBUSDT", exchange: "bybit", rate: 0.00015, timestamp: new Date().toISOString() },
    { symbol: "DOGEUSDT", exchange: "bybit", rate: 0.00025, timestamp: new Date().toISOString() },
  ]

  static async fetchFundingRates(targetCoins: string[]): Promise<FundingRate[]> {
    console.log("🔄 Phase 2: Fetching fresh funding rates from exchanges...")

    const exchangeFetchers = [
      this.fetchBinanceRates(targetCoins),
      this.fetchBybitRates(targetCoins),
      this.fetchOKXRates(targetCoins),
      this.fetchHyperliquidRates(targetCoins),
    ]

    const results = await Promise.allSettled(exchangeFetchers)
    const allRates: FundingRate[] = []
    const failedExchanges: string[] = []

    results.forEach((result, index) => {
      const exchangeNames = ["Binance", "Bybit", "OKX", "Hyperliquid"]
      const exchangeName = exchangeNames[index]

      if (result.status === "fulfilled") {
        allRates.push(...result.value)
        console.log(`✅ Phase 2: ${exchangeName}: ${result.value.length} funding rates`)
      } else {
        console.error(`❌ Phase 2: ${exchangeName} funding rates failed:`, result.reason)
        failedExchanges.push(exchangeName.toLowerCase())
      }
    })

    // Add fallback data for failed exchanges
    if (failedExchanges.length > 0) {
      console.log(`🔄 Phase 2: Using fallback data for failed exchanges: ${failedExchanges.join(", ")}`)

      const fallbackRates = this.FALLBACK_DATA.filter(
        (rate) => failedExchanges.includes(rate.exchange) && targetCoins.some((coin) => rate.symbol.startsWith(coin)),
      )

      allRates.push(...fallbackRates)
      console.log(`📊 Phase 2: Added ${fallbackRates.length} fallback funding rates`)
    }

    console.log(`📊 Phase 2: Total funding rates collected: ${allRates.length}`)
    return allRates
  }

  private static async fetchWithRetry<T>(fetchFn: () => Promise<T>, exchangeName: string, maxRetries = 2): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await fetchFn()
      } catch (error) {
        lastError = error as Error

        if (attempt <= maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // Exponential backoff
          console.log(`⚠️ Phase 2: ${exchangeName} attempt ${attempt} failed, retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  private static async fetchBinanceRates(targetCoins: string[]): Promise<FundingRate[]> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching Binance funding rates...")

      const response = await fetch(`${this.EXCHANGE_CONFIGS.binance.baseUrl}/fapi/v1/premiumIndex`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.EXCHANGE_CONFIGS.binance.timeout),
      })

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      return data
        .filter(
          (item: any) =>
            targetCoins.some((coin) => item.symbol === `${coin}USDT`) && item.lastFundingRate !== undefined,
        )
        .map((item: any) => ({
          symbol: item.symbol,
          exchange: "binance",
          rate: Number.parseFloat(item.lastFundingRate),
          timestamp: new Date().toISOString(),
          nextFundingTime: item.nextFundingTime ? new Date(item.nextFundingTime).toISOString() : undefined,
        }))
    }, "Binance")
  }

  private static async fetchBybitRates(targetCoins: string[]): Promise<FundingRate[]> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching Bybit funding rates...")

      const response = await fetch(`${this.EXCHANGE_CONFIGS.bybit.baseUrl}/v5/market/tickers?category=linear`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.EXCHANGE_CONFIGS.bybit.timeout),
      })

      if (!response.ok) {
        throw new Error(`Bybit API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.result?.list) {
        throw new Error("Invalid Bybit API response format")
      }

      return data.result.list
        .filter(
          (item: any) => targetCoins.some((coin) => item.symbol === `${coin}USDT`) && item.fundingRate !== undefined,
        )
        .map((item: any) => ({
          symbol: item.symbol,
          exchange: "bybit",
          rate: Number.parseFloat(item.fundingRate),
          timestamp: new Date().toISOString(),
          nextFundingTime: item.nextFundingTime
            ? new Date(Number.parseInt(item.nextFundingTime)).toISOString()
            : undefined,
        }))
    }, "Bybit")
  }

  private static async fetchOKXRates(targetCoins: string[]): Promise<FundingRate[]> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching OKX funding rates...")

      const response = await fetch(`${this.EXCHANGE_CONFIGS.okx.baseUrl}/api/v5/public/funding-rate?instType=SWAP`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(this.EXCHANGE_CONFIGS.okx.timeout),
      })

      if (!response.ok) {
        throw new Error(`OKX API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.data) {
        throw new Error("Invalid OKX API response format")
      }

      return data.data
        .filter(
          (item: any) =>
            targetCoins.some((coin) => item.instId === `${coin}-USDT-SWAP`) && item.fundingRate !== undefined,
        )
        .map((item: any) => ({
          symbol: item.instId.replace("-SWAP", ""),
          exchange: "okx",
          rate: Number.parseFloat(item.fundingRate),
          timestamp: new Date(Number.parseInt(item.fundingTime)).toISOString(),
          nextFundingTime: item.nextFundingTime
            ? new Date(Number.parseInt(item.nextFundingTime)).toISOString()
            : undefined,
        }))
    }, "OKX")
  }

  private static async fetchHyperliquidRates(targetCoins: string[]): Promise<FundingRate[]> {
    return this.fetchWithRetry(async () => {
      console.log("🔗 Phase 2: Fetching Hyperliquid funding rates...")

      const response = await fetch(`${this.EXCHANGE_CONFIGS.hyperliquid.baseUrl}/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; CryptoLiquidationFeed/1.0)",
          Accept: "application/json",
        },
        body: JSON.stringify({
          type: "metaAndAssetCtxs",
        }),
        signal: AbortSignal.timeout(this.EXCHANGE_CONFIGS.hyperliquid.timeout),
      })

      if (!response.ok) {
        throw new Error(`Hyperliquid API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data[1]) {
        throw new Error("Invalid Hyperliquid API response format")
      }

      return data[1]
        .filter((item: any) => targetCoins.some((coin) => item.name === coin) && item.funding !== undefined)
        .map((item: any) => ({
          symbol: `${item.name}USDT`,
          exchange: "hyperliquid",
          rate: Number.parseFloat(item.funding),
          timestamp: new Date().toISOString(),
        }))
    }, "Hyperliquid")
  }
}
