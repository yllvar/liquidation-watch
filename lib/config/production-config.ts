// Updated production configuration - OPTIONAL monitoring only
export class ProductionConfig {
  static validateEnvironment(): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required environment variables for production
    const requiredVars = {
      NODE_ENV: process.env.NODE_ENV,
    }

    // Optional monitoring variables (not required for functionality)
    const optionalVars = {
      SENTRY_DSN: process.env.SENTRY_DSN, // For error tracking (optional)
      ANALYTICS_ID: process.env.ANALYTICS_ID, // For user analytics (optional)
    }

    // Validate required variables
    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value) {
        errors.push(`Missing required environment variable: ${key}`)
      }
    }

    // Log optional variables status (but don't fail)
    for (const [key, value] of Object.entries(optionalVars)) {
      if (!value) {
        console.log(`Optional environment variable not set: ${key}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static getApiConfig() {
    return {
      timeout: process.env.NODE_ENV === "production" ? 15000 : 30000,
      retries: process.env.NODE_ENV === "production" ? 3 : 1,
      cacheTimeout: process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000,
    }
  }

  static getWebSocketConfig() {
    return {
      reconnectAttempts: process.env.NODE_ENV === "production" ? 10 : 5,
      reconnectDelay: process.env.NODE_ENV === "production" ? 5000 : 2000,
      heartbeatInterval: 30000,
      connectionTimeout: 30000,
    }
  }

  // Optional: Initialize Sentry if DSN is provided
  static initializeMonitoring() {
    if (process.env.SENTRY_DSN && typeof window !== "undefined") {
      console.log("Sentry DSN found - you can initialize Sentry here later")
      // We'll add Sentry initialization later if you want it
    }

    if (process.env.ANALYTICS_ID && typeof window !== "undefined") {
      console.log("Analytics ID found - you can initialize analytics here later")
      // We'll add Google Analytics initialization later if you want it
    }
  }
}
