"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  TrendingUp,
  BarChart3,
  Fish,
  LineChart,
  PieChart,
  Target,
  AlertTriangle,
  DollarSign,
  Shield,
  BookOpen,
  Lightbulb,
} from "lucide-react"

interface UserGuideModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserGuideModal({ open, onOpenChange }: UserGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6 text-primary" />
            Liquidation Watch - User Guide
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[calc(90vh-100px)]">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Welcome to Liquidation Watch</h3>
              </div>
              <p className="text-muted-foreground">
                Your comprehensive platform for monitoring cryptocurrency liquidations across major exchanges. Track
                whale movements, analyze market sentiment, and backtest trading strategies with real-time data.
              </p>
            </div>

            <Separator />

            {/* Liquidations Tab */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Liquidations Tab</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Live Liquidation Feed
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Real-time liquidations from Binance, Bybit, and OKX</li>
                    <li>• Color-coded by side: Green (Long) / Red (Short)</li>
                    <li>• Asset symbols, prices, and liquidation values</li>
                    <li>• Time stamps showing how recent each liquidation is</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Fish className="h-4 w-4" />
                    Whale Alerts Panel
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Filters liquidations above $250K threshold</li>
                    <li>• 60-minute retention history</li>
                    <li>• Exchange logos for quick identification</li>
                    <li>• Glowing animation for new whale liquidations</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Search & Filter Tools</h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline">Search by symbol</Badge>
                  <Badge variant="outline">Filter by exchange</Badge>
                  <Badge variant="outline">Minimum value filter</Badge>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Use the search bar to find specific assets like "BTC" or "ETH". Apply filters to focus on high-value
                  liquidations.
                </p>
              </div>
            </div>

            <Separator />

            {/* Charts Tab */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">Charts Tab</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Trading Pairs & Exchanges</h4>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge>BTC</Badge>
                    <Badge>ETH</Badge>
                    <Badge>SOL</Badge>
                    <Badge>ADA</Badge>
                    <Badge>DOT</Badge>
                    <Badge>AVAX</Badge>
                    <Badge>LINK</Badge>
                    <Badge>MATIC</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select from 8 major trading pairs across Binance, Bybit, and OKX exchanges.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Chart Types & Timeframes</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Line Chart: Clean price movement visualization</li>
                    <li>• Candlestick: OHLC data with volume</li>
                    <li>• Volume Analysis: Trading volume patterns</li>
                    <li>• Timeframes: 1m, 5m, 15m, 1h, 4h, 1d</li>
                  </ul>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Market Statistics</h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Each chart displays current price, 24h change percentage, daily high/low, and trading volume. Data
                  updates every 30 seconds for real-time analysis.
                </p>
              </div>
            </div>

            <Separator />

            {/* Analytics Tab */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">Analytics Tab</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Market Overview</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Total liquidations across all exchanges</li>
                    <li>• Long vs Short liquidation ratios</li>
                    <li>• Top liquidated assets by volume</li>
                    <li>• Exchange market share analysis</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Funding Rates</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Current funding rates across exchanges</li>
                    <li>• Historical funding rate trends</li>
                    <li>• Correlation with liquidation events</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Backtesting Tab */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">Backtesting Tab</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">Trading Strategies</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • <strong>Mean Reversion:</strong> Buy oversold, sell overbought
                    </li>
                    <li>
                      • <strong>Liquidation Cascade:</strong> Trade liquidation clusters
                    </li>
                    <li>
                      • <strong>Trend Confirmation:</strong> Follow strong trends
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Market Scenarios</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Bull Run, Bear Market, Sideways</li>
                    <li>• High Volatility, Market Crash, Pump</li>
                    <li>• Historical data simulation</li>
                  </ul>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-orange-600 dark:text-orange-400">
                  <div>• Sharpe Ratio</div>
                  <div>• Sortino Ratio</div>
                  <div>• Calmar Ratio</div>
                  <div>• Maximum Drawdown</div>
                  <div>• Win Rate</div>
                  <div>• Profit Factor</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Best Practices */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Best Practices & Tips</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium text-blue-700 dark:text-blue-300">Analysis</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Monitor whale alerts for market sentiment</li>
                    <li>• Look for liquidation clusters</li>
                    <li>• Compare across exchanges</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium text-green-700 dark:text-green-300">Trading</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use multiple timeframes</li>
                    <li>• Backtest before live trading</li>
                    <li>• Consider funding rates</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    <h4 className="font-medium text-red-700 dark:text-red-300">Risk</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Never risk more than you can afford</li>
                    <li>• Use stop losses</li>
                    <li>• Diversify your positions</li>
                  </ul>
                </div>
              </div>
            </div>

            <Separator />

            {/* Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">Important Disclaimer</h4>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    This platform is for educational purposes only. All data is simulated for demonstration.
                    Cryptocurrency trading involves significant risk. Always conduct your own research and consider
                    consulting with financial advisors before making investment decisions.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Ready to explore? Close this guide and start analyzing liquidation data!
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
