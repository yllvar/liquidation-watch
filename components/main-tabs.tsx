"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingDown, LineChart, BarChart3, TestTube } from "lucide-react"
import { LiquidationTable } from "./liquidation-table"
import { AnalyticsView } from "./analytics-view"
import { BacktestingDashboard } from "./backtesting-dashboard"
import { ChartPanel } from "./chart-panel"

interface MainTabsProps {
  soundEnabled: boolean
}

export function MainTabs({ soundEnabled }: MainTabsProps) {
  return (
    <Tabs defaultValue="liquidations" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="liquidations" className="gap-2">
          <TrendingDown className="h-4 w-4" />
          Liquidations
        </TabsTrigger>
        <TabsTrigger value="charts" className="gap-2">
          <LineChart className="h-4 w-4" />
          Charts
        </TabsTrigger>
        <TabsTrigger value="analytics" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="backtesting" className="gap-2">
          <TestTube className="h-4 w-4" />
          Backtesting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="liquidations" className="space-y-4">
        <LiquidationTable soundEnabled={soundEnabled} />
      </TabsContent>

      <TabsContent value="charts" className="space-y-4">
        <ChartPanel />
      </TabsContent>

      <TabsContent value="analytics" className="space-y-4">
        <AnalyticsView />
      </TabsContent>

      <TabsContent value="backtesting" className="space-y-4">
        <BacktestingDashboard />
      </TabsContent>
    </Tabs>
  )
}
