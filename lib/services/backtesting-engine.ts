import { DataSimulation, type SimulatedLiquidation } from "./data-simulation"

export interface BacktestConfig {
  strategy: "mean_reversion" | "liquidation_cascade" | "trend_confirmation"
  symbol: string
  scenario: string
  initialCapital: number
  positionSize: number
  stopLoss: number
  takeProfit: number
}

export interface Trade {
  id: string
  timestamp: number
  symbol: string
  side: "BUY" | "SELL"
  price: number
  quantity: number
  pnl: number
  reason: string
}

export interface BacktestResult {
  config: BacktestConfig
  trades: Trade[]
  totalReturn: number
  winRate: number
  sharpeRatio: number
  maxDrawdown: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  equityCurve: { timestamp: number; equity: number }[]
  metrics: {
    volatility: number
    sortinoRatio: number
    calmarRatio: number
    averageWin: number
    averageLoss: number
  }
}

export class BacktestingEngine {
  private static generateTradeId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  static async runBacktest(
    config: BacktestConfig,
    onProgress?: (progress: number, currentMetrics?: Partial<BacktestResult>) => void,
  ): Promise<BacktestResult> {
    const scenario = DataSimulation.getMarketScenarios().find((s) => s.id === config.scenario)
    if (!scenario) {
      throw new Error(`Scenario ${config.scenario} not found`)
    }

    // Simulate market data
    const { priceData, liquidations } = DataSimulation.simulateMarketData(
      scenario,
      config.symbol,
      24, // 24 hours
      5, // 5-minute intervals
    )

    const trades: Trade[] = []
    let currentCapital = config.initialCapital
    let position = 0
    let positionPrice = 0
    const equityCurve: { timestamp: number; equity: number }[] = []

    // Sort liquidations by timestamp
    const sortedLiquidations = liquidations.sort((a, b) => a.timestamp - b.timestamp)
    const sortedPriceData = priceData.sort((a, b) => a.timestamp - b.timestamp)

    let liquidationIndex = 0
    const priceIndex = 0

    for (let i = 0; i < sortedPriceData.length; i++) {
      const currentPrice = sortedPriceData[i].price
      const timestamp = sortedPriceData[i].timestamp

      // Process liquidations that occurred before this price point
      while (
        liquidationIndex < sortedLiquidations.length &&
        sortedLiquidations[liquidationIndex].timestamp <= timestamp
      ) {
        const liquidation = sortedLiquidations[liquidationIndex]
        const signal = this.generateTradingSignal(config.strategy, liquidation, sortedLiquidations, liquidationIndex)

        if (signal && currentCapital > 0) {
          const trade = this.executeTrade(signal, currentPrice, config, currentCapital, position, positionPrice)

          if (trade) {
            trades.push(trade)
            currentCapital += trade.pnl

            if (signal.action === "BUY") {
              position += trade.quantity
              positionPrice = trade.price
            } else if (signal.action === "SELL") {
              position -= trade.quantity
              if (position <= 0) {
                position = 0
                positionPrice = 0
              }
            }
          }
        }

        liquidationIndex++
      }

      // Add equity curve point
      const unrealizedPnl = position > 0 ? (currentPrice - positionPrice) * position : 0
      const totalEquity = currentCapital + unrealizedPnl

      equityCurve.push({
        timestamp,
        equity: totalEquity,
      })

      // Report progress
      if (onProgress) {
        const progress = (i / sortedPriceData.length) * 100
        const currentMetrics = this.calculatePartialMetrics(trades, currentCapital, config.initialCapital)
        onProgress(progress, currentMetrics)
      }

      // Small delay to make progress visible
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }

    // Close any remaining position
    if (position > 0 && sortedPriceData.length > 0) {
      const finalPrice = sortedPriceData[sortedPriceData.length - 1].price
      const closeTrade: Trade = {
        id: this.generateTradeId(),
        timestamp: sortedPriceData[sortedPriceData.length - 1].timestamp,
        symbol: config.symbol,
        side: "SELL",
        price: finalPrice,
        quantity: position,
        pnl: (finalPrice - positionPrice) * position,
        reason: "Position closed at end of backtest",
      }
      trades.push(closeTrade)
      currentCapital += closeTrade.pnl
    }

    return this.calculateResults(config, trades, equityCurve, currentCapital)
  }

  private static generateTradingSignal(
    strategy: string,
    liquidation: SimulatedLiquidation,
    allLiquidations: SimulatedLiquidation[],
    currentIndex: number,
  ): { action: "BUY" | "SELL"; confidence: number } | null {
    switch (strategy) {
      case "mean_reversion":
        return this.meanReversionSignal(liquidation, allLiquidations, currentIndex)
      case "liquidation_cascade":
        return this.liquidationCascadeSignal(liquidation, allLiquidations, currentIndex)
      case "trend_confirmation":
        return this.trendConfirmationSignal(liquidation, allLiquidations, currentIndex)
      default:
        return null
    }
  }

  private static meanReversionSignal(
    liquidation: SimulatedLiquidation,
    allLiquidations: SimulatedLiquidation[],
    currentIndex: number,
  ): { action: "BUY" | "SELL"; confidence: number } | null {
    // Look for clusters of liquidations in the same direction
    const lookbackPeriod = 10
    const startIndex = Math.max(0, currentIndex - lookbackPeriod)
    const recentLiquidations = allLiquidations.slice(startIndex, currentIndex + 1)

    const buyLiquidations = recentLiquidations.filter((l) => l.side === "BUY").length
    const sellLiquidations = recentLiquidations.filter((l) => l.side === "SELL").length

    // If there are many liquidations in one direction, expect mean reversion
    if (buyLiquidations >= 3 && buyLiquidations > sellLiquidations * 2) {
      return { action: "SELL", confidence: Math.min(buyLiquidations / 5, 1) }
    } else if (sellLiquidations >= 3 && sellLiquidations > buyLiquidations * 2) {
      return { action: "BUY", confidence: Math.min(sellLiquidations / 5, 1) }
    }

    return null
  }

  private static liquidationCascadeSignal(
    liquidation: SimulatedLiquidation,
    allLiquidations: SimulatedLiquidation[],
    currentIndex: number,
  ): { action: "BUY" | "SELL"; confidence: number } | null {
    // Look for large liquidations that might trigger cascades
    if (liquidation.value < 50000) return null

    const lookbackPeriod = 5
    const startIndex = Math.max(0, currentIndex - lookbackPeriod)
    const recentLiquidations = allLiquidations.slice(startIndex, currentIndex)

    const recentVolume = recentLiquidations.reduce((sum, l) => sum + l.value, 0)

    // If this is a large liquidation following other large liquidations, expect continuation
    if (recentVolume > 100000) {
      return {
        action: liquidation.side === "BUY" ? "BUY" : "SELL",
        confidence: Math.min(liquidation.value / 100000, 1),
      }
    }

    return null
  }

  private static trendConfirmationSignal(
    liquidation: SimulatedLiquidation,
    allLiquidations: SimulatedLiquidation[],
    currentIndex: number,
  ): { action: "BUY" | "SELL"; confidence: number } | null {
    // Use liquidations to confirm trend direction
    const lookbackPeriod = 15
    const startIndex = Math.max(0, currentIndex - lookbackPeriod)
    const recentLiquidations = allLiquidations.slice(startIndex, currentIndex + 1)

    const buyValue = recentLiquidations.filter((l) => l.side === "BUY").reduce((sum, l) => sum + l.value, 0)
    const sellValue = recentLiquidations.filter((l) => l.side === "SELL").reduce((sum, l) => sum + l.value, 0)

    const totalValue = buyValue + sellValue
    if (totalValue < 10000) return null

    const buyRatio = buyValue / totalValue
    const sellRatio = sellValue / totalValue

    // If liquidations are heavily skewed in one direction, trade with the trend
    if (buyRatio > 0.7) {
      return { action: "BUY", confidence: buyRatio }
    } else if (sellRatio > 0.7) {
      return { action: "SELL", confidence: sellRatio }
    }

    return null
  }

  private static executeTrade(
    signal: { action: "BUY" | "SELL"; confidence: number },
    currentPrice: number,
    config: BacktestConfig,
    availableCapital: number,
    currentPosition: number,
    positionPrice: number,
  ): Trade | null {
    const positionValue = config.positionSize * availableCapital
    const quantity = positionValue / currentPrice

    if (signal.action === "BUY" && availableCapital >= positionValue) {
      return {
        id: this.generateTradeId(),
        timestamp: Date.now(),
        symbol: config.symbol,
        side: "BUY",
        price: currentPrice,
        quantity,
        pnl: -positionValue, // Initial cost
        reason: `${config.strategy} buy signal (confidence: ${(signal.confidence * 100).toFixed(1)}%)`,
      }
    } else if (signal.action === "SELL" && currentPosition > 0) {
      const sellValue = currentPrice * quantity
      const pnl = sellValue - positionPrice * quantity

      return {
        id: this.generateTradeId(),
        timestamp: Date.now(),
        symbol: config.symbol,
        side: "SELL",
        price: currentPrice,
        quantity,
        pnl,
        reason: `${config.strategy} sell signal (confidence: ${(signal.confidence * 100).toFixed(1)}%)`,
      }
    }

    return null
  }

  private static calculatePartialMetrics(
    trades: Trade[],
    currentCapital: number,
    initialCapital: number,
  ): Partial<BacktestResult> {
    if (trades.length === 0) {
      return {
        totalReturn: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
      }
    }

    const winningTrades = trades.filter((t) => t.pnl > 0).length
    const losingTrades = trades.filter((t) => t.pnl < 0).length
    const totalReturn = ((currentCapital - initialCapital) / initialCapital) * 100
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0

    return {
      totalReturn,
      winRate,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
    }
  }

  private static calculateResults(
    config: BacktestConfig,
    trades: Trade[],
    equityCurve: { timestamp: number; equity: number }[],
    finalCapital: number,
  ): BacktestResult {
    const winningTrades = trades.filter((t) => t.pnl > 0)
    const losingTrades = trades.filter((t) => t.pnl < 0)

    const totalReturn = ((finalCapital - config.initialCapital) / config.initialCapital) * 100
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0

    const returns = equityCurve
      .map((point, index) => {
        if (index === 0) return 0
        return (point.equity - equityCurve[index - 1].equity) / equityCurve[index - 1].equity
      })
      .filter((r) => !isNaN(r))

    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0
    const returnStd =
      returns.length > 0
        ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
        : 0

    const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0

    const maxEquity = Math.max(...equityCurve.map((p) => p.equity))
    const maxDrawdown = equityCurve.reduce((maxDD, point) => {
      const drawdown = ((maxEquity - point.equity) / maxEquity) * 100
      return Math.max(maxDD, drawdown)
    }, 0)

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0)
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0

    const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0

    const downReturns = returns.filter((r) => r < 0)
    const downStd =
      downReturns.length > 0
        ? Math.sqrt(downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length)
        : 0
    const sortinoRatio = downStd > 0 ? (avgReturn / downStd) * Math.sqrt(252) : 0
    const calmarRatio = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0

    return {
      config,
      trades,
      totalReturn,
      winRate,
      sharpeRatio,
      maxDrawdown,
      profitFactor,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      equityCurve,
      metrics: {
        volatility: returnStd * Math.sqrt(252) * 100,
        sortinoRatio,
        calmarRatio,
        averageWin,
        averageLoss,
      },
    }
  }
}
