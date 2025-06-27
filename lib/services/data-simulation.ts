export interface SimulatedLiquidation {
  timestamp: number
  symbol: string
  exchange: string
  side: "BUY" | "SELL"
  price: number
  quantity: number
  value: number
}

export interface MarketScenario {
  id: string
  name: string
  description: string
  volatility: number
  trendBias: number
  liquidationMultiplier: number
}

export interface SimulatedPriceData {
  timestamp: number
  symbol: string
  price: number
  volume: number
}

export class DataSimulation {
  private static readonly SYMBOLS = [
    { symbol: "BTCUSDT", basePrice: 43000, volatility: 0.02 },
    { symbol: "ETHUSDT", basePrice: 2600, volatility: 0.025 },
    { symbol: "SOLUSDT", basePrice: 98, volatility: 0.04 },
    { symbol: "ADAUSDT", basePrice: 0.48, volatility: 0.035 },
    { symbol: "DOTUSDT", basePrice: 7.2, volatility: 0.03 },
  ]

  private static readonly EXCHANGES = ["BINANCE", "BYBIT", "OKX"]

  private static readonly MARKET_SCENARIOS: MarketScenario[] = [
    {
      id: "bull_run",
      name: "Bull Run",
      description: "Strong upward momentum with high liquidation activity",
      volatility: 0.03,
      trendBias: 0.002,
      liquidationMultiplier: 1.5,
    },
    {
      id: "bear_market",
      name: "Bear Market",
      description: "Sustained downward pressure with heavy selling",
      volatility: 0.025,
      trendBias: -0.0015,
      liquidationMultiplier: 1.3,
    },
    {
      id: "sideways",
      name: "Sideways",
      description: "Range-bound trading with low volatility",
      volatility: 0.015,
      trendBias: 0,
      liquidationMultiplier: 0.8,
    },
    {
      id: "high_volatility",
      name: "High Volatility",
      description: "Extreme price swings in both directions",
      volatility: 0.05,
      trendBias: 0,
      liquidationMultiplier: 2.0,
    },
    {
      id: "market_crash",
      name: "Market Crash",
      description: "Sudden sharp decline with panic liquidations",
      volatility: 0.08,
      trendBias: -0.005,
      liquidationMultiplier: 3.0,
    },
    {
      id: "pump",
      name: "Pump",
      description: "Rapid price increase with FOMO-driven liquidations",
      volatility: 0.06,
      trendBias: 0.004,
      liquidationMultiplier: 2.5,
    },
  ]

  static getMarketScenarios(): MarketScenario[] {
    return [...this.MARKET_SCENARIOS]
  }

  static getSymbols(): string[] {
    return this.SYMBOLS.map((s) => s.symbol)
  }

  static simulateMarketData(
    scenario: MarketScenario,
    symbol: string,
    durationHours = 24,
    intervalMinutes = 5,
  ): {
    priceData: SimulatedPriceData[]
    liquidations: SimulatedLiquidation[]
  } {
    const symbolData = this.SYMBOLS.find((s) => s.symbol === symbol)
    if (!symbolData) {
      throw new Error(`Symbol ${symbol} not supported`)
    }

    const intervals = Math.floor((durationHours * 60) / intervalMinutes)
    const priceData: SimulatedPriceData[] = []
    const liquidations: SimulatedLiquidation[] = []

    let currentPrice = symbolData.basePrice
    const startTime = Date.now() - durationHours * 60 * 60 * 1000

    for (let i = 0; i < intervals; i++) {
      const timestamp = startTime + i * intervalMinutes * 60 * 1000

      // Generate price movement
      const volatility = symbolData.volatility * scenario.volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility
      const trendChange = scenario.trendBias
      const totalChange = randomChange + trendChange

      currentPrice = currentPrice * (1 + totalChange)

      // Ensure price doesn't go negative
      currentPrice = Math.max(currentPrice, symbolData.basePrice * 0.1)

      const volume = Math.random() * 1000000 + 500000

      priceData.push({
        timestamp,
        symbol,
        price: currentPrice,
        volume,
      })

      // Generate liquidations based on price movement
      const priceChangePercent = Math.abs(totalChange)
      const liquidationProbability = priceChangePercent * scenario.liquidationMultiplier * 10

      if (Math.random() < liquidationProbability) {
        const numLiquidations = Math.floor(Math.random() * 3) + 1

        for (let j = 0; j < numLiquidations; j++) {
          const exchange = this.EXCHANGES[Math.floor(Math.random() * this.EXCHANGES.length)]

          // Determine liquidation side based on price movement
          let side: "BUY" | "SELL"
          if (totalChange > 0) {
            // Price going up, liquidate shorts (BUY liquidations)
            side = Math.random() < 0.7 ? "BUY" : "SELL"
          } else {
            // Price going down, liquidate longs (SELL liquidations)
            side = Math.random() < 0.7 ? "SELL" : "BUY"
          }

          const liquidationPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.01)
          const quantity = Math.random() * 100 + 10
          const value = liquidationPrice * quantity

          liquidations.push({
            timestamp: timestamp + Math.random() * intervalMinutes * 60 * 1000,
            symbol,
            exchange,
            side,
            price: liquidationPrice,
            quantity,
            value,
          })
        }
      }

      // Add some background liquidations
      if (Math.random() < 0.3) {
        const exchange = this.EXCHANGES[Math.floor(Math.random() * this.EXCHANGES.length)]
        const side = Math.random() < 0.5 ? "BUY" : "SELL"
        const liquidationPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.005)
        const quantity = Math.random() * 50 + 5
        const value = liquidationPrice * quantity

        liquidations.push({
          timestamp: timestamp + Math.random() * intervalMinutes * 60 * 1000,
          symbol,
          exchange,
          side,
          price: liquidationPrice,
          quantity,
          value,
        })
      }
    }

    return { priceData, liquidations }
  }

  static generateRealtimeLiquidation(symbol?: string): SimulatedLiquidation {
    const selectedSymbol = symbol || this.SYMBOLS[Math.floor(Math.random() * this.SYMBOLS.length)]
    const symbolData =
      typeof selectedSymbol === "string" ? this.SYMBOLS.find((s) => s.symbol === selectedSymbol) : selectedSymbol

    if (!symbolData) {
      throw new Error("Invalid symbol")
    }

    const exchange = this.EXCHANGES[Math.floor(Math.random() * this.EXCHANGES.length)]
    const side = Math.random() < 0.5 ? "BUY" : "SELL"
    const price = symbolData.basePrice * (1 + (Math.random() - 0.5) * 0.02)
    const quantity = Math.random() * 100 + 10
    const value = price * quantity

    return {
      timestamp: Date.now(),
      symbol: symbolData.symbol,
      exchange,
      side,
      price,
      quantity,
      value,
    }
  }
}
