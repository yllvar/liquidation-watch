"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Play, Square, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from "lucide-react"
import { BacktestingEngine, type BacktestConfig, type BacktestResult } from "@/lib/services/backtesting-engine"
import { DataSimulation } from "@/lib/services/data-simulation"
import { cn } from "@/lib/utils"

export function BacktestingDashboard() {
  const [config, setConfig] = useState<BacktestConfig>({
    strategy: "mean_reversion",
    symbol: "BTCUSDT",
    scenario: "bull_run",
    initialCapital: 10000,
    positionSize: 0.1,
    stopLoss: 0.05,
    takeProfit: 0.1,
  })

  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<Partial<BacktestResult> | null>(null)

  const marketScenarios = DataSimulation.getMarketScenarios()
  const symbols = DataSimulation.getSymbols()

  const strategies = [
    {
      id: "mean_reversion",
      name: "Mean Reversion",
      description: "Fades liquidation clusters expecting price to revert to mean",
    },
    {
      id: "liquidation_cascade",
      name: "Liquidation Cascade",
      description: "Trades in the direction of large liquidations expecting cascades",
    },
    {
      id: "trend_confirmation",
      name: "Trend Confirmation",
      description: "Uses liquidation patterns to confirm and trade with trends",
    },
  ]

  const runBacktest = async () => {
    setIsRunning(true)
    setProgress(0)
    setResult(null)
    setCurrentMetrics(null)

    try {
      const result = await BacktestingEngine.runBacktest(config, (progress, metrics) => {
        setProgress(progress)
        setCurrentMetrics(metrics || null)
      })
      setResult(result)
    } catch (error) {
      console.error("Backtest failed:", error)
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  const stopBacktest = () => {
    setIsRunning(false)
    setProgress(0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
  }

  const selectedStrategy = strategies.find((s) => s.id === config.strategy)
  const selectedScenario = marketScenarios.find((s) => s.id === config.scenario)

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Backtest Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Select
                value={config.strategy}
                onValueChange={(value: any) => setConfig({ ...config, strategy: value })}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStrategy && <p className="text-xs text-muted-foreground">{selectedStrategy.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Select
                value={config.symbol}
                onValueChange={(value) => setConfig({ ...config, symbol: value })}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenario">Market Scenario</Label>
              <Select
                value={config.scenario}
                onValueChange={(value) => setConfig({ ...config, scenario: value })}
                disabled={isRunning}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {marketScenarios.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedScenario && <p className="text-xs text-muted-foreground">{selectedScenario.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capital">Initial Capital</Label>
              <Input
                id="capital"
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) })}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position-size">Position Size (%)</Label>
              <Input
                id="position-size"
                type="number"
                step="0.01"
                min="0.01"
                max="1"
                value={config.positionSize}
                onChange={(e) => setConfig({ ...config, positionSize: Number(e.target.value) })}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stop-loss">Stop Loss (%)</Label>
              <Input
                id="stop-loss"
                type="number"
                step="0.01"
                min="0.01"
                max="1"
                value={config.stopLoss}
                onChange={(e) => setConfig({ ...config, stopLoss: Number(e.target.value) })}
                disabled={isRunning}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="take-profit">Take Profit (%)</Label>
              <Input
                id="take-profit"
                type="number"
                step="0.01"
                min="0.01"
                max="1"
                value={config.takeProfit}
                onChange={(e) => setConfig({ ...config, takeProfit: Number(e.target.value) })}
                disabled={isRunning}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runBacktest} disabled={isRunning} className="gap-2">
              <Play className="h-4 w-4" />
              {isRunning ? "Running..." : "Run Backtest"}
            </Button>
            {isRunning && (
              <Button onClick={stopBacktest} variant="outline" className="gap-2 bg-transparent">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="w-full" />

              {currentMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p
                      className={cn(
                        "font-bold",
                        (currentMetrics.totalReturn || 0) >= 0 ? "text-green-500" : "text-red-500",
                      )}
                    >
                      {formatPercentage(currentMetrics.totalReturn || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="font-bold">{(currentMetrics.winRate || 0).toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                    <p className="font-bold">{currentMetrics.totalTrades || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Win/Loss</p>
                    <p className="font-bold text-green-500">{currentMetrics.winningTrades || 0}</p>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-bold text-red-500">{currentMetrics.losingTrades || 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Return</p>
                      <p
                        className={cn(
                          "text-2xl font-bold",
                          result.totalReturn >= 0 ? "text-green-500" : "text-red-500",
                        )}
                      >
                        {formatPercentage(result.totalReturn)}
                      </p>
                    </div>
                    {result.totalReturn >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                      <p className="text-2xl font-bold">{result.winRate.toFixed(1)}%</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-2xl font-bold">{result.sharpeRatio.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Max Drawdown</p>
                      <p className="text-2xl font-bold text-red-500">-{result.maxDrawdown.toFixed(2)}%</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-xl font-bold">{result.totalTrades}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Profit Factor</p>
                  <p className="text-xl font-bold">{result.profitFactor.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Win/Loss Ratio</p>
                  <p className="text-xl font-bold">
                    <span className="text-green-500">{result.winningTrades}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-500">{result.losingTrades}</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="equity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Equity Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.equityCurve}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(value), "Equity"]}
                        labelFormatter={(value) => new Date(value).toLocaleString()}
                      />
                      <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {result.trades.map((trade, index) => (
                    <div
                      key={trade.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        trade.pnl >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={trade.side === "BUY" ? "default" : "secondary"}>{trade.side}</Badge>
                        <div>
                          <p className="font-medium">{trade.symbol}</p>
                          <p className="text-sm text-muted-foreground">{new Date(trade.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(trade.price)}</p>
                        <p className={cn("text-sm font-bold", trade.pnl >= 0 ? "text-green-500" : "text-red-500")}>
                          {trade.pnl >= 0 ? "+" : ""}
                          {formatCurrency(trade.pnl)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Volatility</span>
                    <span className="font-bold">{result.metrics.volatility.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sortino Ratio</span>
                    <span className="font-bold">{result.metrics.sortinoRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Calmar Ratio</span>
                    <span className="font-bold">{result.metrics.calmarRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Drawdown</span>
                    <span className="font-bold text-red-500">-{result.maxDrawdown.toFixed(2)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trade Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Win</span>
                    <span className="font-bold text-green-500">{formatCurrency(result.metrics.averageWin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Loss</span>
                    <span className="font-bold text-red-500">-{formatCurrency(result.metrics.averageLoss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Factor</span>
                    <span className="font-bold">{result.profitFactor.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate</span>
                    <span className="font-bold">{result.winRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Educational Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Educational Purpose Only</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This backtesting system uses simulated data for educational purposes. Results do not guarantee future
                performance. Always conduct thorough research and consider your risk tolerance before making investment
                decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
