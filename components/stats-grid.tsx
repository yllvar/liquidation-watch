"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsGridProps {
  stats: {
    buyCount: number
    sellCount: number
    largestLiquidation: any
    dailyStreak: number
  }
  totalValue: number
  selectedExchanges: string[]
}

export function StatsGrid({ stats, totalValue, selectedExchanges }: StatsGridProps) {
  const { buyCount, sellCount, largestLiquidation } = stats
  const totalLiquidations = buyCount + sellCount
  const buyRatio = totalLiquidations > 0 ? (buyCount / totalLiquidations) * 100 : 50
  const sellRatio = totalLiquidations > 0 ? (sellCount / totalLiquidations) * 100 : 50

  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`
    return `$${num.toFixed(2)}`
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Liquidation Battle */}
      <Card className="col-span-2 md:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Liquidation Tug of War</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary mb-2">{totalLiquidations.toLocaleString()}</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-2 cursor-help">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-500">Buy: {buyCount}</span>
                    <span className="text-red-500">Sell: {sellCount}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "absolute left-0 h-full bg-green-500 transition-all duration-300",
                        buyRatio > 50 && "animate-pulse",
                      )}
                      style={{ width: `${buyRatio}%` }}
                    />
                    <div
                      className={cn(
                        "absolute right-0 h-full bg-red-500 transition-all duration-300",
                        sellRatio > 50 && "animate-pulse",
                      )}
                      style={{ width: `${sellRatio}%` }}
                    />
                    <div
                      className="absolute w-1 h-full bg-white shadow-lg z-10"
                      style={{ left: `${buyRatio}%`, transform: "translateX(-50%)" }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Buy: {buyCount} vs Sell: {sellCount}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Largest Liquidation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Largest Seen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {largestLiquidation ? formatCurrency(largestLiquidation.value) : "-"}
          </div>
          {largestLiquidation?.symbol && (
            <p className="text-xs text-muted-foreground mt-1">{largestLiquidation.symbol}</p>
          )}
        </CardContent>
      </Card>

      {/* Total Value */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            Total Liquidation Value
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Current total liquidation value: ${totalValue.toLocaleString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalValue)}</div>
        </CardContent>
      </Card>

      {/* Active Exchanges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Exchanges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{selectedExchanges.length}</div>
          <p className="text-xs text-muted-foreground mt-1">of 3 available</p>
        </CardContent>
      </Card>
    </div>
  )
}
