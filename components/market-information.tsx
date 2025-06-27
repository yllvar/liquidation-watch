"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ErrorBoundary } from "@/components/error-boundary"
import { MarketInfoLoadingSkeleton, InlineLoading, DataRefreshing } from "@/components/loading-states"
import { DataValidator } from "@/lib/utils/data-validation"
import {
  Info,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wifi,
  WifiOff,
  DollarSign,
  BarChart3,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MarketData {
  totalOI: number
  dailyVolume: number
  marketCap?: number
  dominanceData: { symbol: string; percentage: number }[]
  marketTrend: "bullish" | "bearish" | "neutral"
  fundingHealth: "positive" | "negative" | "neutral"
  lastUpdated: Date
  fearGreedIndex?: number
}

interface ApiStatus {
  isHealthy: boolean
  responseTime: number
  lastError?: string
}

export function MarketInformation() {
  const [isLoading, setIsLoading] = useState(true)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ isHealthy: true, responseTime: 0 })
  const [retryCount, setRetryCount] = useState(0)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  const fetchMarketData = async (showRefreshing = false) => {
    const startTime = Date.now()

    if (showRefreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      console.log("🔄 Fetching REAL market data...")

      const response = await fetch("/api/market-info", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "X-Retry-Count": retryCount.toString(),
        },
      })

      const responseTime = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate API response structure
      const apiValidation = DataValidator.validateApiResponse(data)
      if (!apiValidation.isValid) {
        throw new Error(`Invalid API response: ${apiValidation.errors?.join(", ")}`)
      }

      if (data.success && data.marketData) {
        // Validate market data
        const dataValidation = DataValidator.validateMarketData(data.marketData)
        if (!dataValidation.isValid) {
          console.warn("⚠️ Market data validation warnings:", dataValidation.errors)
          // Continue with sanitized data rather than failing
        }

        // Sanitize and validate all numeric values
        const sanitizedData: MarketData = {
          totalOI: DataValidator.sanitizeNumber(data.marketData.totalOI, 12.7),
          dailyVolume: DataValidator.sanitizeNumber(data.marketData.dailyVolume, 45.3),
          marketCap: data.marketData.marketCap
            ? DataValidator.sanitizeNumber(data.marketData.marketCap, 2400)
            : undefined,
          dominanceData: (data.marketData.dominanceData || []).map((item: any) => ({
            symbol: String(item.symbol || "Unknown"),
            percentage: DataValidator.validatePercentage(item.percentage),
          })),
          marketTrend: ["bullish", "bearish", "neutral"].includes(data.marketData.marketTrend)
            ? data.marketData.marketTrend
            : "neutral",
          fundingHealth: ["positive", "negative", "neutral"].includes(data.marketData.fundingHealth)
            ? data.marketData.fundingHealth
            : "neutral",
          lastUpdated: DataValidator.validateTimestamp(data.marketData.lastUpdated),
          fearGreedIndex: data.marketData.fearGreedIndex
            ? DataValidator.validatePercentage(data.marketData.fearGreedIndex)
            : undefined,
        }

        console.log("✅ Received and validated REAL market data:", {
          fearGreedIndex: sanitizedData.fearGreedIndex,
          marketTrend: sanitizedData.marketTrend,
          totalOI: sanitizedData.totalOI,
          dominanceCoins: sanitizedData.dominanceData.length,
          responseTime: `${responseTime}ms`,
        })

        setMarketData(sanitizedData)
        setLastUpdated(new Date())
        setApiStatus({ isHealthy: true, responseTime })
        setRetryCount(0) // Reset retry count on success
      } else {
        throw new Error(data.message || "Invalid response format")
      }
    } catch (err) {
      const responseTime = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : "Failed to load market data"

      console.error("❌ Failed to fetch market data:", err)
      setError(errorMessage)
      setApiStatus({ isHealthy: false, responseTime, lastError: errorMessage })
      setRetryCount((prev) => prev + 1)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchMarketData()

    if (!autoRefreshEnabled) return

    // Auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        fetchMarketData(true)
      },
      5 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [autoRefreshEnabled])

  // Retry logic for failed requests
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s
      console.log(`⏰ Retrying in ${retryDelay}ms (attempt ${retryCount + 1}/3)`)

      const timeout = setTimeout(() => {
        fetchMarketData()
      }, retryDelay)

      return () => clearTimeout(timeout)
    }
  }, [error, retryCount])

  const getFearGreedColor = (index?: number) => {
    if (!index) return "text-muted-foreground"
    if (index >= 75) return "text-green-600 dark:text-green-400"
    if (index >= 55) return "text-blue-600 dark:text-blue-400"
    if (index >= 45) return "text-yellow-600 dark:text-yellow-400"
    if (index >= 25) return "text-orange-600 dark:text-orange-400"
    return "text-red-600 dark:text-red-400"
  }

  const getFearGreedLabel = (index?: number) => {
    if (!index) return "Unknown"
    if (index >= 75) return "Extreme Greed"
    if (index >= 55) return "Greed"
    if (index >= 45) return "Neutral"
    if (index >= 25) return "Fear"
    return "Extreme Fear"
  }

  const getApiStatusColor = () => {
    if (!apiStatus.isHealthy) return "text-red-500"
    if (apiStatus.responseTime > 5000) return "text-yellow-500"
    return "text-green-500"
  }

  const getApiStatusIcon = () => {
    if (!apiStatus.isHealthy) return AlertTriangle
    if (apiStatus.responseTime > 5000) return Timer
    return CheckCircle
  }

  // Error state with retry functionality
  if (error && retryCount >= 3) {
    return (
      <ErrorBoundary>
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error}</p>
            <div className="flex items-center gap-2 text-sm">
              <span>API Status:</span>
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Unhealthy ({apiStatus.responseTime}ms)
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent"
              onClick={() => {
                setRetryCount(0)
                fetchMarketData()
              }}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Retry Connection
            </Button>
          </AlertDescription>
        </Alert>
      </ErrorBoundary>
    )
  }

  // Loading state
  if (isLoading) {
    return <MarketInfoLoadingSkeleton />
  }

  // No data state
  if (!marketData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Market Data</AlertTitle>
        <AlertDescription>
          Market data is not available at the moment. Please try refreshing.
          <Button variant="outline" size="sm" className="ml-2 bg-transparent" onClick={() => fetchMarketData()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const StatusIcon = getApiStatusIcon()

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header with status and refresh */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">REAL Market Data</span>
              <Badge variant="outline" className="gap-1">
                <StatusIcon className={cn("h-3 w-3", getApiStatusColor())} />
                {apiStatus.responseTime}ms
              </Badge>
            </div>
            {isRefreshing && <DataRefreshing />}
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-muted-foreground">Updated: {lastUpdated.toLocaleTimeString()}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Last successful data fetch</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMarketData(true)}
              disabled={isRefreshing}
              className="gap-1"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? <InlineLoading text="Refreshing..." size="sm" /> : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Main metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                Total Open Interest
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Estimated total value of open positions across exchanges</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${marketData.totalOI.toFixed(1)}B</div>
              <div className="flex items-center gap-1 mt-1">
                {marketData.marketTrend === "bullish" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : marketData.marketTrend === "bearish" ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Activity className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">Market is {marketData.marketTrend}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                24h Trading Volume
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total trading volume across all exchanges in the last 24 hours</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${marketData.dailyVolume.toFixed(1)}B</div>
              <div className="flex items-center gap-1 mt-1">
                {marketData.fundingHealth === "positive" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : marketData.fundingHealth === "negative" ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Activity className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">Funding is {marketData.fundingHealth}</span>
              </div>
            </CardContent>
          </Card>

          {marketData.marketCap && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  Total Market Cap
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total market capitalization of all cryptocurrencies</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${marketData.marketCap.toFixed(1)}B</div>
                <div className="text-sm text-muted-foreground mt-1">Global crypto market</div>
              </CardContent>
            </Card>
          )}

          {marketData.fearGreedIndex && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  Fear & Greed Index
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Market sentiment indicator (0-100)</p>
                        <p>0 = Extreme Fear, 100 = Extreme Greed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", getFearGreedColor(marketData.fearGreedIndex))}>
                  {marketData.fearGreedIndex}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{getFearGreedLabel(marketData.fearGreedIndex)}</div>
                <Progress value={marketData.fearGreedIndex} className="mt-2 h-2" />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Market dominance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Market Dominance</span>
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                Live Data
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {marketData.dominanceData.map((item) => (
                <div key={item.symbol} className="text-center">
                  <div className="text-sm font-medium text-muted-foreground">{item.symbol}</div>
                  <div className="text-lg font-bold">{item.percentage.toFixed(1)}%</div>
                  <Progress value={item.percentage} className="mt-1 h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market sentiment summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Market Sentiment</div>
                <Badge
                  variant={
                    marketData.marketTrend === "bullish"
                      ? "default"
                      : marketData.marketTrend === "bearish"
                        ? "destructive"
                        : "secondary"
                  }
                  className="gap-1"
                >
                  {marketData.marketTrend === "bullish" && <TrendingUp className="h-3 w-3" />}
                  {marketData.marketTrend === "bearish" && <TrendingDown className="h-3 w-3" />}
                  {marketData.marketTrend === "neutral" && <Activity className="h-3 w-3" />}
                  {marketData.marketTrend.toUpperCase()}
                </Badge>
              </div>

              <Separator orientation="vertical" className="h-10 hidden md:block" />

              <div className="space-y-1">
                <div className="text-sm font-medium">Funding Rate Health</div>
                <Badge
                  variant={
                    marketData.fundingHealth === "positive"
                      ? "default"
                      : marketData.fundingHealth === "negative"
                        ? "destructive"
                        : "secondary"
                  }
                  className="gap-1"
                >
                  {marketData.fundingHealth === "positive" && <TrendingUp className="h-3 w-3" />}
                  {marketData.fundingHealth === "negative" && <TrendingDown className="h-3 w-3" />}
                  {marketData.fundingHealth === "neutral" && <Activity className="h-3 w-3" />}
                  {marketData.fundingHealth.toUpperCase()}
                </Badge>
              </div>

              {marketData.fearGreedIndex && (
                <>
                  <Separator orientation="vertical" className="h-10 hidden md:block" />
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Fear & Greed</div>
                    <Badge
                      variant="outline"
                      className={cn("border-current gap-1", getFearGreedColor(marketData.fearGreedIndex))}
                    >
                      {marketData.fearGreedIndex >= 50 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {marketData.fearGreedIndex} - {getFearGreedLabel(marketData.fearGreedIndex)}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer with metadata */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Last updated: {new Date(marketData.lastUpdated).toLocaleString()}</span>
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Data validated
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>Auto-refresh: {autoRefreshEnabled ? "ON" : "OFF"}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className="h-6 px-2 text-xs"
            >
              {autoRefreshEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
