interface FundingRate {
  symbol: string
  coin: string
  lastFundingRate: number
  nextFundingTime: number
  exchange: string
}

export class FundingRateService {
  static async fetchFundingRates(targetCoins: string[]): Promise<FundingRate[]> {
    const allRates: FundingRate[] = []

    // Fetch from multiple exchanges in parallel
    const [binanceRates, bybitRates, okxRates, hyperliquidRates] = await Promise.allSettled([
      this.fetchBinanceRates(targetCoins),
      this.fetchBybitRates(targetCoins),
      this.fetchOkxRates(targetCoins),
      this.fetchHyperliquidRates(targetCoins),
    ])

    // Combine results
    if (binanceRates.status === "fulfilled") allRates.push(...binanceRates.value)
    if (bybitRates.status === "fulfilled") allRates.push(...bybitRates.value)
    if (okxRates.status === "fulfilled") allRates.push(...okxRates.value)
    if (hyperliquidRates.status === "fulfilled") allRates.push(...hyperliquidRates.value)

    return allRates
  }

  private static async fetchBinanceRates(targetCoins: string[]): Promise<FundingRate[]> {
    const response = await fetch("https://fapi.binance.com/fapi/v1/premiumIndex")
    const data = await response.json()

    return data
      .filter((rate: any) => {
        const coin = this.extractCoin(rate.symbol)
        return rate.symbol.endsWith("USDT") && targetCoins.includes(coin)
      })
      .map((rate: any) => ({
        symbol: rate.symbol,
        coin: this.extractCoin(rate.symbol),
        lastFundingRate: Number.parseFloat(rate.lastFundingRate) * 100,
        nextFundingTime: rate.nextFundingTime,
        exchange: "Binance",
      }))
  }

  private static async fetchBybitRates(targetCoins: string[]): Promise<FundingRate[]> {
    // Implementation for Bybit API calls
    // Note: You'll need to adapt the bybit-api package for server-side use
    // or use direct HTTP calls
    return []
  }

  private static async fetchOkxRates(targetCoins: string[]): Promise<FundingRate[]> {
    const rates: FundingRate[] = []
    const okxSymbols = targetCoins.map((coin) => `${coin}-USDT-SWAP`)

    for (const symbol of okxSymbols) {
      try {
        const response = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${symbol}`)
        const data = await response.json()

        if (data.data && data.data.length > 0) {
          const rateData = data.data[0]
          const coin = this.extractCoin(rateData.instId)

          if (targetCoins.includes(coin)) {
            rates.push({
              symbol: rateData.instId,
              coin,
              lastFundingRate: Number.parseFloat(rateData.fundingRate) * 100,
              nextFundingTime: Number.parseInt(rateData.nextFundingTime),
              exchange: "OKX",
            })
          }
        }
      } catch (error) {
        console.error(`Error fetching OKX data for ${symbol}:`, error)
      }
    }

    return rates
  }

  private static async fetchHyperliquidRates(targetCoins: string[]): Promise<FundingRate[]> {
    try {
      const response = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "metaAndAssetCtxs",
        }),
      })

      const data = await response.json()
      const rates: FundingRate[] = []

      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        const coinIndices: Record<string, number> = {
          BTC: 0,
          ETH: 1,
          SOL: 2,
          LTC: 8,
          XRP: 9,
          BNB: 10,
          DOGE: 7,
          ADA: 12,
          SUI: 5,
        }

        for (const coin of targetCoins) {
          const index = coinIndices[coin]
          if (index !== undefined && data[1][index] && data[1][index].funding !== undefined) {
            const fundingRate = Number.parseFloat(data[1][index].funding) * 100

            if (!isNaN(fundingRate)) {
              const currentTime = Date.now()
              const nextFundingTime = currentTime + 8 * 60 * 60 * 1000

              rates.push({
                symbol: `${coin}USDT`,
                coin,
                lastFundingRate: fundingRate,
                nextFundingTime: nextFundingTime,
                exchange: "Hyperliquid",
              })
            }
          }
        }
      }

      return rates
    } catch (error) {
      console.error("Error fetching Hyperliquid data:", error)
      return []
    }
  }

  private static extractCoin(symbol: string): string {
    if (symbol.includes("-")) {
      return symbol.split("-")[0]
    }
    return symbol.replace(/USDT$/, "")
  }
}
