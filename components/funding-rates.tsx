"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ErrorBoundary } from "@/components/error-boundary"
import { FundingRatesLoadingSkeleton, InlineLoading, DataRefreshing } from "@/components/loading-states"
import { DataValidator } from "@/lib/utils/data-validation"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  Timer,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FundingRate {
  symbol: string
  coin: string
  lastFundingRate: number
  nextFundingTime: number
  exchange: string
}

interface ApiStatus {
  isHealthy: boolean
  responseTime: number
  lastError?: string
}

export function FundingRates() {
  const [fundingRates, setFundingRates] = useState<FundingRate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ isHealthy: true, responseTime: 0 })
  const [retryCount, setRetryCount] = useState(0)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  const fetchFundingRates = async (showRefreshing = false) => {
    const startTime = Date.now()

    if (showRefreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      console.log("🔄 Fetching REAL funding rates...")
      const response = await fetch("/api/funding-rates", {
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

      // Validate API response
      const apiValidation = DataValidator.validateApiResponse(data)
      if (!apiValidation.isValid) {
        throw new Error(`Invalid API response: ${apiValidation.errors?.join(", ")}`)
      }

      if (data.success && data.fundingRates) {
        // Validate and sanitize funding rates
        const validatedRates = data.fundingRates
          .map((rate: any) => {
            const validation = DataValidator.validateFundingRate(rate)
            if (validation.isValid) {
              return validation.data
            } else {
              console.warn("⚠️ Invalid funding rate data:", validation.errors)
              return null
            }
          })
          .filter(Boolean)

        console.log(`✅ Received ${validatedRates.length} REAL funding rates from ${data.exchanges?.join(", ")}`)
        setFundingRates(validatedRates)
        setLastUpdated(new Date())
        setApiStatus({ isHealthy: true, responseTime })
        setRetryCount(0)
      } else {
        throw new Error(data.message || "Invalid response format")
      }
    } catch (err) {
      const responseTime = Date.now() - startTime
      const errorMessage = err instanceof Error ? err.message : "Failed to load funding rates"

      console.error("❌ Failed to fetch funding rates:", err)
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
    fetchFundingRates()

    if (!autoRefreshEnabled) return

    // Auto-refresh every 2 minutes
    const interval = setInterval(
      () => {
        fetchFundingRates(true)
      },
      2 * 60 * 1000,
    )

    return () => clearInterval(interval)
  }, [autoRefreshEnabled])

  // Retry logic for failed requests
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000)
      console.log(`⏰ Retrying funding rates in ${retryDelay}ms (attempt ${retryCount + 1}/3)`)

      const timeout = setTimeout(() => {
        fetchFundingRates()
      }, retryDelay)

      return () => clearTimeout(timeout)
    }
  }, [error, retryCount])

  const formatFundingRate = (rate: number) => {
    return `${rate.toFixed(4)}%`
  }

  const getFundingRateColor = (rate: number) => {
    if (rate > 0.01) return "text-red-600 dark:text-red-400"
    if (rate > 0) return "text-orange-600 dark:text-orange-400"
    if (rate < -0.01) return "text-green-600 dark:text-green-400"
    if (rate < 0) return "text-blue-600 dark:text-blue-400"
    return "text-muted-foreground"
  }

  const getFundingRateIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="h-3 w-3" />
    if (rate < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
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

  const groupedRates = fundingRates.reduce(
    (acc, rate) => {
      if (!acc[rate.exchange]) acc[rate.exchange] = []
      acc[rate.exchange].push(rate)
      return acc
    },
    {} as Record<string, FundingRate[]>,
  )

  const exchangeStats = Object.entries(groupedRates).map(([exchange, rates]) => ({
    exchange,
    count: rates.length,
    avgRate: rates.reduce((sum, r) => sum + r.lastFundingRate, 0) / rates.length,
  }))

  // Error state with retry functionality
  if (error && retryCount >= 3) {
    return (
      <ErrorBoundary>
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p>
              <strong>Connection Error:</strong> {error}
            </p>
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
                fetchFundingRates()
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
    return <FundingRatesLoadingSkeleton />
  }

  const StatusIcon = getApiStatusIcon()

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header with stats and refresh */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">REAL Data</span>
              <Badge variant="outline" className="gap-1">
                <StatusIcon className={cn("h-3 w-3", getApiStatusColor())} />
                {apiStatus.responseTime}ms
              </Badge>
            </div>
            <div className="flex gap-2">
              {exchangeStats.map((stat) => (
                <TooltipProvider key={stat.exchange}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="gap-1">
                        {stat.exchange}: {stat.count}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average rate: {stat.avgRate.toFixed(4)}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            {isRefreshing && <DataRefreshing text="Refreshing rates..." />}
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
              onClick={() => fetchFundingRates(true)}
              disabled={isRefreshing}
              className="gap-1"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? <InlineLoading text="Refreshing..." size="sm" /> : "Refresh"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({fundingRates.length})</TabsTrigger>
            <TabsTrigger value="Binance">Binance ({groupedRates.Binance?.length || 0})</TabsTrigger>
            <TabsTrigger value="Bybit">Bybit ({groupedRates.Bybit?.length || 0})</TabsTrigger>
            <TabsTrigger value="OKX">OKX ({groupedRates.OKX?.length || 0})</TabsTrigger>
            <TabsTrigger value="Hyperliquid">Hyperliquid ({groupedRates.Hyperliquid?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Funding Rates</span>
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {fundingRates.length} Validated
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Exchange</TableHead>
                        <TableHead className="text-right">Funding Rate</TableHead>
                        <TableHead className="text-right">Next Funding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundingRates.map((rate, index) => (
                        <TableRow key={`${rate.exchange}-${rate.symbol}-${index}`}>
                          <TableCell className="font-medium">{rate.coin}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rate.exchange}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className={cn(
                                "flex items-center justify-end gap-1",
                                getFundingRateColor(rate.lastFundingRate),
                              )}
                            >
                              {getFundingRateIcon(rate.lastFundingRate)}
                              <span className="font-mono">{formatFundingRate(rate.lastFundingRate)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {rate.nextFundingTime ? new Date(rate.nextFundingTime).toLocaleTimeString() : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {Object.entries(groupedRates).map(([exchange, rates]) => (
            <TabsContent key={exchange} value={exchange} className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{exchange} Funding Rates</span>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {rates.length} Rates
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead className="text-right">Funding Rate</TableHead>
                        <TableHead className="text-right">Next Funding</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map((rate, index) => (
                        <TableRow key={`${rate.symbol}-${index}`}>
                          <TableCell className="font-medium">{rate.coin}</TableCell>
                          <TableCell className="text-right">
                            <div
                              className={cn(
                                "flex items-center justify-end gap-1",
                                getFundingRateColor(rate.lastFundingRate),
                              )}
                            >
                              {getFundingRateIcon(rate.lastFundingRate)}
                              <span className="font-mono">{formatFundingRate(rate.lastFundingRate)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {rate.nextFundingTime ? new Date(rate.nextFundingTime).toLocaleTimeString() : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer with metadata */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Data validated
            </Badge>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
