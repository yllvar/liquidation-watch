"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Fish } from "lucide-react"
import { DateTime } from "luxon"
import { useLiquidationStore } from "@/lib/stores/liquidation-store"
import { cn } from "@/lib/utils"

interface WhaleAlertTableProps {
  soundEnabled: boolean
  threshold?: number
  retention?: number
}

// Helper function to safely get timestamp
const getTimestamp = (timestamp: any): number => {
  if (!timestamp) return Date.now()
  if (DateTime.isDateTime(timestamp)) return timestamp.toMillis()
  if (typeof timestamp === "string") return DateTime.fromISO(timestamp).toMillis()
  if (typeof timestamp === "number") return timestamp
  return Date.now()
}

export function WhaleAlertTable({ soundEnabled, threshold = 250000, retention = 60 }: WhaleAlertTableProps) {
  const liquidations = useLiquidationStore((state) => state.liquidations)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [persistedWhaleLiquidations, setPersistedWhaleLiquidations] = useState<any[]>([])

  // Update persisted whale liquidations
  useEffect(() => {
    const newWhaleLiquidations = liquidations.filter((l) => l.value >= threshold)

    if (newWhaleLiquidations.length === 0) return

    setPersistedWhaleLiquidations((prevWhales) => {
      const existingIds = new Set(
        prevWhales.map((whale) => `${getTimestamp(whale.timestamp)}-${whale.symbol}-${whale.value}`),
      )

      const newWhales = newWhaleLiquidations.filter(
        (whale) => !existingIds.has(`${getTimestamp(whale.timestamp)}-${whale.symbol}-${whale.value}`),
      )

      return [...prevWhales, ...newWhales]
    })
  }, [liquidations, threshold])

  // Clean up old whale liquidations
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const retentionMs = retention * 60 * 1000
      const cutoffTime = Date.now() - retentionMs

      setPersistedWhaleLiquidations((prevWhales) =>
        prevWhales.filter((whale) => getTimestamp(whale.timestamp) > cutoffTime),
      )
    }, 60000)

    return () => clearInterval(cleanupInterval)
  }, [retention])

  const whaleLiquidations = useMemo(
    () =>
      [...persistedWhaleLiquidations]
        .sort((a, b) => getTimestamp(b.timestamp) - getTimestamp(a.timestamp))
        .slice(0, 50),
    [persistedWhaleLiquidations],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
    return `$${num.toFixed(0)}`
  }

  const formatTimeAgo = (timestamp: any) => {
    const timestampMs = getTimestamp(timestamp)
    const timeAgoInSeconds = Math.floor((currentTime - timestampMs) / 1000)
    const timeAgoInMinutes = Math.floor(timeAgoInSeconds / 60)

    if (timeAgoInSeconds < 60) return `${timeAgoInSeconds}s`
    if (timeAgoInMinutes < 60) return `${timeAgoInMinutes}m`
    return `${Math.floor(timeAgoInMinutes / 60)}h${timeAgoInMinutes % 60}m`
  }

  const formatSymbol = (symbol: string) => {
    return symbol.replace("USDT", "").replace(/--?SWAP/, "")
  }

  const isNewWhale = (timestamp: any) => {
    return currentTime - getTimestamp(timestamp) < 30000
  }

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="h-5 w-5" />
            <span>Whale Alerts</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{formatLargeNumber(threshold)}+</Badge>
            <Badge variant="secondary">{retention}m history</Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {whaleLiquidations.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="px-6">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[40%]">Asset</TableHead>
                    <TableHead className="w-[35%] text-right">Value</TableHead>
                    <TableHead className="w-[25%] text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {whaleLiquidations.map((liquidation, index) => {
                    const timestampMs = getTimestamp(liquidation.timestamp)
                    const isNew = isNewWhale(liquidation.timestamp)
                    const entryAge = (currentTime - timestampMs) / 1000
                    const fadeLevel = Math.min(1, entryAge / (retention * 60))
                    const opacity = 1 - fadeLevel * 0.4

                    return (
                      <TableRow
                        key={`${timestampMs}-${liquidation.symbol}-${liquidation.value}-${index}`}
                        className={cn(
                          "border-l-2 transition-all duration-300",
                          liquidation.side === "BUY"
                            ? "border-l-green-500 bg-green-500/10 hover:bg-green-500/20"
                            : "border-l-red-500 bg-red-500/10 hover:bg-red-500/20",
                          isNew && "whale-glow",
                        )}
                        style={{ opacity }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {liquidation.exchange === "BINANCE" && (
                              <img src="/bnb.svg" alt="Binance" className="w-4 h-4" />
                            )}
                            {liquidation.exchange === "BYBIT" && (
                              <img src="/bybit.svg" alt="Bybit" className="w-4 h-4" />
                            )}
                            {liquidation.exchange === "OKX" && <img src="/okx.svg" alt="OKX" className="w-4 h-4" />}
                            <span className="font-semibold text-sm truncate">{formatSymbol(liquidation.symbol)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span
                                  className={cn(
                                    "font-bold text-sm",
                                    liquidation.side === "BUY"
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400",
                                  )}
                                >
                                  {formatLargeNumber(liquidation.value)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {liquidation.side === "SELL" ? "Long" : "Short"} liquidated at $
                                  {liquidation.price.toLocaleString()}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={isNew ? "default" : "secondary"} className="text-xs">
                            {formatTimeAgo(liquidation.timestamp)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="animate-pulse mb-4">
              <Fish className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-sm text-muted-foreground">
              Watching for whale liquidations
              <br />
              over {formatLargeNumber(threshold)}
            </p>
          </div>
        )}
      </CardContent>

      <div className="p-3 border-t text-center text-xs text-muted-foreground flex-shrink-0">
        {whaleLiquidations.length > 0
          ? `${whaleLiquidations.length} whale liquidations • Retained for ${retention} minutes`
          : "Monitoring market for large liquidations"}
      </div>
    </Card>
  )
}
