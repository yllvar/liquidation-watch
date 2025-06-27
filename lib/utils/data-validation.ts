import { z } from "zod"

// Enhanced validation schemas for all data types
export const LiquidationSchema = z.object({
  exchange: z.enum(["BINANCE", "BYBIT", "OKX"]),
  symbol: z.string().min(1),
  side: z.enum(["BUY", "SELL"]),
  orderType: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  orderStatus: z.string(),
  timestamp: z.any(), // DateTime object or string
  value: z.number().positive(),
})

export const FundingRateSchema = z.object({
  symbol: z.string().min(1),
  coin: z.string().min(1),
  lastFundingRate: z.number(),
  nextFundingTime: z.number(),
  exchange: z.string().min(1),
})

export const MarketDataSchema = z.object({
  totalOI: z.number().positive(),
  dailyVolume: z.number().positive(),
  marketCap: z.number().positive().optional(),
  dominanceData: z.array(
    z.object({
      symbol: z.string(),
      percentage: z.number().min(0).max(100),
    }),
  ),
  marketTrend: z.enum(["bullish", "bearish", "neutral"]),
  fundingHealth: z.enum(["positive", "negative", "neutral"]),
  lastUpdated: z.date(),
  fearGreedIndex: z.number().min(0).max(100).optional(),
})

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  timestamp: z.string(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export class DataValidator {
  static validateLiquidation(data: any): { isValid: boolean; data?: any; errors?: string[] } {
    try {
      const validated = LiquidationSchema.parse(data)
      return { isValid: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        }
      }
      return { isValid: false, errors: ["Unknown validation error"] }
    }
  }

  static validateFundingRate(data: any): { isValid: boolean; data?: any; errors?: string[] } {
    try {
      const validated = FundingRateSchema.parse(data)
      return { isValid: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        }
      }
      return { isValid: false, errors: ["Unknown validation error"] }
    }
  }

  static validateMarketData(data: any): { isValid: boolean; data?: any; errors?: string[] } {
    try {
      // Convert lastUpdated to Date if it's a string
      if (typeof data.lastUpdated === "string") {
        data.lastUpdated = new Date(data.lastUpdated)
      }

      const validated = MarketDataSchema.parse(data)
      return { isValid: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        }
      }
      return { isValid: false, errors: ["Unknown validation error"] }
    }
  }

  static validateApiResponse(data: any): { isValid: boolean; data?: any; errors?: string[] } {
    try {
      const validated = ApiResponseSchema.parse(data)
      return { isValid: true, data: validated }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        }
      }
      return { isValid: false, errors: ["Unknown validation error"] }
    }
  }

  // Utility function to sanitize and validate numeric values
  static sanitizeNumber(value: any, fallback = 0): number {
    const num = Number(value)
    return isNaN(num) || !isFinite(num) ? fallback : num
  }

  // Utility function to validate percentage values
  static validatePercentage(value: any): number {
    const num = this.sanitizeNumber(value, 0)
    return Math.max(0, Math.min(100, num))
  }

  // Utility function to validate timestamp
  static validateTimestamp(timestamp: any): Date {
    if (timestamp instanceof Date) return timestamp
    if (typeof timestamp === "string") {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? new Date() : date
    }
    if (typeof timestamp === "number") {
      const date = new Date(timestamp)
      return isNaN(date.getTime()) ? new Date() : date
    }
    return new Date()
  }
}
