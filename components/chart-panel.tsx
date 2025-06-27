"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChartData {
  time: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface MarketStats {
  currentPrice: number
  change24h: number
  high24h: number
  low24h: number
  volume24h: number
}

const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT", basePrice: 43000 },
  { value: "ETHUSDT", label: "ETH/USDT", basePrice: 2600 },
  { value: "SOLUSDT", label: "SOL/USDT", basePrice: 98 },
  { value: "ADAUSDT", label: "ADA/USDT", basePrice: 0.48 },
  { value: "DOTUSDT", label: "DOT/USDT", basePrice: 7.2 },
  { value: "AVAXUSDT", label: "AVAX/USDT", basePrice: 36 },
  { value: "LINKUSDT", label: "LINK/USDT", basePrice: 14.5 },
  { value: "MATICUSDT", label: "MATIC/USDT", basePrice: 0.85 },
]

const EXCHANGES = [
  { value: "binance", label: "Binance", color: "bg-yellow-500" },
  { value: "bybit", label: "Bybit", color: "bg-orange-500" },
  { value: "okx", label: "OKX", color: "bg-blue-500" },
]

const TIMEFRAMES = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
]

export function ChartPanel() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT")
  const [selectedExchange, setSelectedExchange] = useState("binance")
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const generateChartData = (symbol: string, timeframe: string): ChartData[] => {
    const symbolData = SYMBOLS.find((s) => s.value === symbol)
    const basePrice = symbolData?.basePrice || 100
    const dataPoints = 50
    const data: ChartData[] = []

    let currentPrice = basePrice
    const volatility = 0.02 // 2% volatility

    for (let i = 0; i < dataPoints; i++) {
      const timeOffset =
        i *
        (timeframe === "1m"
          ? 60000
          : timeframe === "5m"
            ? 300000
            : timeframe === "15m"
              ? 900000
              : timeframe === "1h"
                ? 3600000
                : timeframe === "4h"
                  ? 14400000
                  : 86400000)
      const timestamp = new Date(Date.now() - (dataPoints - i) * timeOffset)

      // Generate realistic OHLC data
      const open = currentPrice
      const change = (Math.random() - 0.5) * volatility * currentPrice
      const high = open + Math.abs(change) + Math.random() * 0.01 * currentPrice
      const low = open - Math.abs(change) - Math.random() * 0.01 * currentPrice
      const close = open + change
      const volume = Math.random() * 1000000 + 500000

      data.push({
        time: timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        price: close,
        open,
        high,
        low,
        close,
        volume,
      })

      currentPrice = close
    }

    return data
  }

  const generateMarketStats = (data: ChartData[]): MarketStats => {
    if (data.length === 0) return { currentPrice: 0, change24h: 0, high24h: 0, low24h: 0, volume24h: 0 }

    const currentPrice = data[data.length - 1].close
    const previousPrice = data[0].open
    const change24h = ((currentPrice - previousPrice) / previousPrice) * 100
    const high24h = Math.max(...data.map((d) => d.high))
    const low24h = Math.min(...data.map((d) => d.low))
    const volume24h = data.reduce((sum, d) => sum + d.volume, 0)

    return { currentPrice, change24h, high24h, low24h, volume24h }
  }

  const loadChartData = async () => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const data = generateChartData(selectedSymbol, selectedTimeframe)
    const stats = generateMarketStats(data)

    setChartData(data)
    setMarketStats(stats)
    setLastUpdate(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    loadChartData()
  }, [selectedSymbol, selectedExchange, selectedTimeframe])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        loadChartData()
      }
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [selectedSymbol, selectedExchange, selectedTimeframe, isLoading])

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    if (price >= 1) return `$${price.toFixed(4)}`
    return `$${price.toFixed(6)}`
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`
    return volume.toFixed(0)
  }

  const selectedSymbolData = SYMBOLS.find((s) => s.value === selectedSymbol)
  const selectedExchangeData = EXCHANGES.find((e) => e.value === selectedExchange)

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <CardTitle className="text-lg">Price Charts</CardTitle>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((symbol) => (
                    <SelectItem key={symbol.value} value={symbol.value}>
                      {symbol.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedExchange} onValueChange={setSelectedExchange}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXCHANGES.map((exchange) => (
                    <SelectItem key={exchange.value} value={exchange.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", exchange.color)} />
                        {exchange.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-1">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={selectedTimeframe === tf.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className="px-3"
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadChartData}
                disabled={isLoading}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Market Stats */}
      {marketStats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-lg font-bold">{formatPrice(marketStats.currentPrice)}</p>
                </div>
                <Badge className={cn("gap-1", selectedExchangeData?.color)}>
                  <div className={cn("w-2 h-2 rounded-full", selectedExchangeData?.color)} />
                  {selectedExchangeData?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">24h Change</p>
                  <p
                    className={cn(
                      "text-lg font-bold flex items-center gap-1",
                      marketStats.change24h >= 0 ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {marketStats.change24h >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {marketStats.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">24h High</p>
              <p className="text-lg font-bold">{formatPrice(marketStats.high24h)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">24h Low</p>
              <p className="text-lg font-bold">{formatPrice(marketStats.low24h)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-lg font-bold">{formatVolume(marketStats.volume24h)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {selectedSymbolData?.label} - {selectedTimeframe}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading chart data...</span>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="line" className="space-y-4">
              <TabsList>
                <TabsTrigger value="line">Line Chart</TabsTrigger>
                <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
                <TabsTrigger value="volume">Volume</TabsTrigger>
              </TabsList>

              <TabsContent value="line" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={["dataMin - 100", "dataMax + 100"]} />
                      <Tooltip
                        formatter={(value: any) => [formatPrice(value), "Price"]}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="candlestick" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis domain={["dataMin - 100", "dataMax + 100"]} />
                      <Tooltip
                        formatter={(value: any, name: string) => [formatPrice(value), name]}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Line type="monotone" dataKey="high" stroke="hsl(var(--primary))" strokeWidth={1} dot={false} />
                      <Line type="monotone" dataKey="low" stroke="hsl(var(--primary))" strokeWidth={1} dot={false} />
                      <Line type="monotone" dataKey="close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="volume" className="space-y-4">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [formatVolume(value), "Volume"]}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <div className="px-6 pb-4">
          <p className="text-xs text-muted-foreground">
            * This is simulated market data for educational purposes only. Not real trading data.
          </p>
        </div>
      </Card>
    </div>
  )
}
