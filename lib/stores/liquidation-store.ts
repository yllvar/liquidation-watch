import { create } from "zustand"
import { DateTime } from "luxon"
import type { Liquidation } from "../types/liquidation"

interface Achievement {
  id: string
  title: string
  description: string
  unlocked: boolean
  timestamp?: DateTime
}

interface LiquidationState {
  liquidations: Liquidation[]
  totalValue: number
  highScore: number
  achievements: Achievement[]
  addLiquidation: (liquidation: Liquidation) => void
  stats: {
    buyCount: number
    sellCount: number
    largestLiquidation: Liquidation | null
    dailyStreak: number
    lastActive: DateTime | null
  }
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_million",
    title: "🏆 First Million",
    description: "Witness 1M USDT in total liquidations",
    unlocked: false,
  },
  {
    id: "whale_hunter",
    title: "🐋 Whale Hunter",
    description: "Spot a single liquidation worth over 100k USDT",
    unlocked: false,
  },
  {
    id: "balanced_view",
    title: "⚖️ Balanced View",
    description: "See equal number buy/sell liquidations (min 10 each)",
    unlocked: false,
  },
]

// Helper function to ensure DateTime objects
const ensureDateTime = (value: any): DateTime => {
  if (!value) return DateTime.now()
  if (DateTime.isDateTime(value)) return value
  if (typeof value === "string") return DateTime.fromISO(value)
  if (typeof value === "number") return DateTime.fromMillis(value)
  return DateTime.now()
}

export const useLiquidationStore = create<LiquidationState>((set) => ({
  liquidations: [],
  totalValue: 0,
  highScore: 0,
  achievements: ACHIEVEMENTS,
  stats: {
    buyCount: 0,
    sellCount: 0,
    largestLiquidation: null,
    dailyStreak: 0,
    lastActive: null,
  },
  addLiquidation: (liquidation) =>
    set((state) => {
      // Ensure the liquidation has a proper DateTime object
      const processedLiquidation = {
        ...liquidation,
        timestamp: ensureDateTime(liquidation.timestamp),
      }

      const newLiquidations = [processedLiquidation, ...state.liquidations].slice(0, 100)
      const newTotalValue = state.totalValue + processedLiquidation.value
      const newHighScore = Math.max(state.highScore, newTotalValue)

      // Update achievements
      const newAchievements = state.achievements.map((achievement) => {
        if (achievement.unlocked) return achievement

        let shouldUnlock = false

        switch (achievement.id) {
          case "first_million":
            shouldUnlock = newTotalValue >= 1000000
            break
          case "whale_hunter":
            shouldUnlock = processedLiquidation.value >= 100000
            break
          case "balanced_view":
            const { buyCount, sellCount } = state.stats
            shouldUnlock = buyCount >= 10 && sellCount >= 10 && buyCount === sellCount
            break
        }

        if (shouldUnlock) {
          return { ...achievement, unlocked: true, timestamp: DateTime.now() }
        }
        return achievement
      })

      // Update streak
      const now = DateTime.now()
      const lastActive = state.stats.lastActive ? ensureDateTime(state.stats.lastActive) : null
      let dailyStreak = state.stats.dailyStreak

      if (!lastActive) {
        dailyStreak = 1
      } else {
        const daysDiff = now.diff(lastActive, "days").days
        if (daysDiff >= 1 && daysDiff < 2) {
          dailyStreak += 1
        } else if (daysDiff >= 2) {
          dailyStreak = 1
        }
      }

      const newStats = {
        buyCount: state.stats.buyCount + (processedLiquidation.side === "BUY" ? 1 : 0),
        sellCount: state.stats.sellCount + (processedLiquidation.side === "SELL" ? 1 : 0),
        largestLiquidation:
          !state.stats.largestLiquidation || processedLiquidation.value > state.stats.largestLiquidation.value
            ? processedLiquidation
            : state.stats.largestLiquidation,
        dailyStreak,
        lastActive: now,
      }

      return {
        liquidations: newLiquidations,
        totalValue: newTotalValue,
        highScore: newHighScore,
        achievements: newAchievements,
        stats: newStats,
      }
    }),
}))
