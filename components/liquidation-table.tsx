"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, DollarSign, X, ChevronDown } from "lucide-react"
import { DateTime } from "luxon"
import { useLiquidationStore } from "@/lib/stores/liquidation-store"
import { WhaleAlertTable } from "./whale-alert-table"
import { cn } from "@/lib/utils"

interface LiquidationTableProps {
  soundEnabled: boolean
}

// Helper function to safely get timestamp
const getTimestamp = (timestamp: any): number => {
  if (!timestamp) return Date.now()
  if (DateTime.isDateTime(timestamp)) return timestamp.toMillis()
  if (typeof timestamp === "string") return DateTime.fromISO(timestamp).toMillis()
  if (typeof timestamp === "number") return timestamp
  return Date.now()
}

export function LiquidationTable({ soundEnabled }: LiquidationTableProps) {
  const liquidations = useLiquidationStore((state) => state.liquidations)
  const [selectedCoins, setSelectedCoins] = useState<string[]>([])
  const [filterInput, setFilterInput] = useState("")
  const [minLiquidationSize, setMinLiquidationSize] = useState(0)
  const [currentTime, setCurrentTime] = useState(Date.now())

  const sortedLiquidations = useMemo(
    () => [...liquidations].sort((a, b) => getTimestamp(b.timestamp) - getTimestamp(a.timestamp)),
    [liquidations],
  )

  const availableCoins = useMemo(() => Array.from(new Set(liquidations.map((l) => l.symbol))).sort(), [liquidations])

  const filteredLiquidations = useMemo(() => {
    const searchTerm = filterInput.toLowerCase()
    return sortedLiquidations.filter((l) => {
      const matchesSelectedCoins = selectedCoins.length === 0 || selectedCoins.includes(l.symbol)
      const matchesSearch =
        searchTerm === "" ||
        l.symbol.toLowerCase().includes(searchTerm) ||
        l.price.toString().includes(searchTerm) ||
        l.value.toString().includes(searchTerm)
      const matchesSize = l.value >= minLiquidationSize
      return matchesSelectedCoins && matchesSearch && matchesSize
    })
  }, [sortedLiquidations, selectedCoins, filterInput, minLiquidationSize])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
    return `$${num}`
  }

  const formatSymbol = (symbol: string) => {
    return symbol.replace("USDT", "").replace(/--?SWAP/, "")
  }

  const formatTimeAgo = (timestamp: any) => {
    const timestampMs = getTimestamp(timestamp)
    const timeAgoInSeconds = Math.floor((currentTime - timestampMs) / 1000)
    const timeAgoInMinutes = Math.floor(timeAgoInSeconds / 60)
    return timeAgoInSeconds < 60 ? `${timeAgoInSeconds}s` : `${timeAgoInMinutes}m`
  }

  const toggleCoinFilter = (coin: string) => {
    if (selectedCoins.includes(coin)) {
      setSelectedCoins(selectedCoins.filter((c) => c !== coin))
    } else {
      setSelectedCoins([...selectedCoins, coin])
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Liquidation Table */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-lg">Live Liquidations</CardTitle>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={filterInput}
                    onChange={(e) => setFilterInput(e.target.value)}
                    className="pl-8 w-40"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Filter className="h-4 w-4" />
                      Filter
                      {selectedCoins.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {selectedCoins.length}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
                    {availableCoins.map((coin) => (
                      <DropdownMenuItem
                        key={coin}
                        onClick={() => toggleCoinFilter(coin)}
                        className="flex items-center justify-between"
                      >
                        <span>{coin}</span>
                        {selectedCoins.includes(coin) && <X className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("gap-2", minLiquidationSize > 0 && "bg-primary text-primary-foreground")}
                    >
                      <DollarSign className="h-4 w-4" />
                      {minLiquidationSize > 0 ? formatCurrency(minLiquidationSize) : "Min"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Minimum Size</h4>
                      <div className="space-y-1">
                        <Button
                          variant={minLiquidationSize === 0 ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setMinLiquidationSize(0)}
                        >
                          No Minimum
                        </Button>
                        {[10000, 50000, 100000, 250000, 500000].map((amount) => (
                          <Button
                            key={amount}
                            variant={minLiquidationSize === amount ? "default" : "ghost"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => setMinLiquidationSize(amount)}
                          >
                            {formatCurrency(amount)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active Filters */}
            {selectedCoins.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedCoins.map((coin) => (
                  <Badge key={coin} variant="secondary" className="gap-1">
                    {coin}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCoinFilter(coin)} />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setSelectedCoins([])} className="h-6 px-2 text-xs">
                  Clear all
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[500px] custom-scrollbar">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[30%]">Asset</TableHead>
                    <TableHead className="w-[25%] text-right">Price</TableHead>
                    <TableHead className="w-[25%] text-right">Value</TableHead>
                    <TableHead className="w-[20%] text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLiquidations.slice(0, 100).map((liquidation, index) => {
                    const timeAgo = formatTimeAgo(liquidation.timestamp)
                    const timestampMs = getTimestamp(liquidation.timestamp)
                    const isRecent = currentTime - timestampMs < 30000
                    const isHighValue = liquidation.value > 50000

                    return (
                      <TableRow
                        key={`${timestampMs}-${liquidation.symbol}-${index}`}
                        className={cn(
                          "liquidation-enter border-l-2 transition-colors",
                          liquidation.side === "BUY"
                            ? "border-l-green-500 bg-green-500/5 hover:bg-green-500/10"
                            : "border-l-red-500 bg-red-500/5 hover:bg-red-500/10",
                          isRecent && "animate-pulse-notification",
                        )}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {liquidation.exchange === "BINANCE" && (
                              <img src="/bnb.svg" alt="Binance" className="w-4 h-4" />
                            )}
                            {liquidation.exchange === "BYBIT" && (
                              <img src="/bybit.svg" alt="Bybit" className="w-4 h-4" />
                            )}
                            {liquidation.exchange === "OKX" && <img src="/okx.svg" alt="OKX" className="w-4 h-4" />}
                            <span className={cn("truncate", isHighValue && "font-bold text-primary")}>
                              {formatSymbol(liquidation.symbol)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(isHighValue && "font-bold text-primary")}>
                            ${liquidation.price.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className={cn("font-medium", isHighValue && "font-bold text-primary")}>
                                  {formatCurrency(liquidation.value)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {liquidation.quantity.toFixed(4)} units at ${liquidation.price.toFixed(2)}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          {isRecent && (
                            <Badge variant="outline" className="text-xs">
                              {timeAgo}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="p-3 border-t text-center text-xs text-muted-foreground">
              {filteredLiquidations.length > 100
                ? "100+ liquidations displayed"
                : `${filteredLiquidations.length} liquidations displayed`}
              {(selectedCoins.length > 0 || minLiquidationSize > 0 || filterInput) &&
                ` (filtered from ${sortedLiquidations.length} total)`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Whale Alert Sidebar - Single Instance */}
      <div className="lg:col-span-1">
        <WhaleAlertTable soundEnabled={soundEnabled} />
      </div>
    </div>
  )
}
