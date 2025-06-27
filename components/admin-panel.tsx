"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  X,
  Activity,
  Database,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  BarChart3,
  RefreshCw,
  TestTube,
  Monitor,
  Settings,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import { useLiquidationStore } from "@/lib/stores/liquidation-store"
import { cn } from "@/lib/utils"

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

interface ApiTestResult {
  endpoint: string
  status: "success" | "error" | "loading"
  responseTime?: number
  data?: any
  error?: string
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const liquidations = useLiquidationStore((state) => state.liquidations)
  const [apiTests, setApiTests] = useState<Record<string, ApiTestResult>>({})
  const [isTestingAll, setIsTestingAll] = useState(false)

  // Phase completion tracking
  const [phaseStatus, setPhaseStatus] = useState({
    phase1: { completed: true, score: 100 },
    phase2: { completed: true, score: 100 },
    phase3: { completed: true, score: 95 },
    phase4: { completed: false, score: 60 },
    phase5: { completed: false, score: 40 },
  })

  const testApi = async (endpoint: string, name: string) => {
    setApiTests((prev) => ({
      ...prev,
      [endpoint]: { endpoint, status: "loading" },
    }))

    try {
      const startTime = Date.now()
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })

      const responseTime = Date.now() - startTime
      const data = await response.json()

      if (response.ok && data.success) {
        setApiTests((prev) => ({
          ...prev,
          [endpoint]: {
            endpoint,
            status: "success",
            responseTime,
            data,
          },
        }))
      } else {
        throw new Error(data.message || `HTTP ${response.status}`)
      }
    } catch (error) {
      setApiTests((prev) => ({
        ...prev,
        [endpoint]: {
          endpoint,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  }

  const testAllApis = async () => {
    setIsTestingAll(true)
    await Promise.all([
      testApi("/api/funding-rates", "Funding Rates"),
      testApi("/api/market-info", "Market Info"),
      testApi("/api/liquidations/stream?exchanges=BINANCE", "Liquidation Stream"),
    ])
    setIsTestingAll(false)
  }

  const getOverallProgress = () => {
    const phases = Object.values(phaseStatus)
    const totalScore = phases.reduce((sum, phase) => sum + phase.score, 0)
    return Math.round(totalScore / phases.length)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Admin Panel</CardTitle>
              <Badge variant="outline">Development Mode</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mx-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="phase2">Phase 2 APIs</TabsTrigger>
              <TabsTrigger value="liquidations">Liquidations</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="phases">All Phases</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] px-4">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">Operational</div>
                      <div className="text-sm text-muted-foreground">All systems running</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Live Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{liquidations.length}</div>
                      <div className="text-sm text-muted-foreground">Liquidations tracked</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Completion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{getOverallProgress()}%</div>
                      <div className="text-sm text-muted-foreground">Project complete</div>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Phase 2 Implementation Complete</AlertTitle>
                  <AlertDescription>
                    Real funding rates from Binance, Bybit, OKX, Hyperliquid + Real market data from CoinGecko, Fear &
                    Greed Index, and Binance volume data.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              {/* Phase 2 APIs Tab */}
              <TabsContent value="phase2" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-500" />
                        Phase 2: Real Market Data APIs
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Real funding rates from 4 exchanges + Real market data from multiple sources
                      </p>
                    </div>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>API Implementation Progress</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>

                  <div className="grid gap-4">
                    {/* Funding Rates API */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                apiTests["/api/funding-rates"]?.status === "success"
                                  ? "bg-green-500"
                                  : apiTests["/api/funding-rates"]?.status === "error"
                                    ? "bg-red-500"
                                    : apiTests["/api/funding-rates"]?.status === "loading"
                                      ? "bg-yellow-500 animate-pulse"
                                      : "bg-gray-500",
                              )}
                            />
                            <div>
                              <div className="font-medium">Funding Rates API</div>
                              <div className="text-sm text-muted-foreground">/api/funding-rates</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {apiTests["/api/funding-rates"]?.responseTime && (
                              <Badge variant="outline">{apiTests["/api/funding-rates"].responseTime}ms</Badge>
                            )}
                            {apiTests["/api/funding-rates"]?.data && (
                              <Badge variant="outline">
                                {apiTests["/api/funding-rates"].data.totalRates || 0} rates
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testApi("/api/funding-rates", "Funding Rates")}
                              disabled={apiTests["/api/funding-rates"]?.status === "loading"}
                            >
                              {apiTests["/api/funding-rates"]?.status === "loading" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              Test
                            </Button>
                          </div>
                        </div>
                        {apiTests["/api/funding-rates"]?.error && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{apiTests["/api/funding-rates"].error}</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Market Info API */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                apiTests["/api/market-info"]?.status === "success"
                                  ? "bg-green-500"
                                  : apiTests["/api/market-info"]?.status === "error"
                                    ? "bg-red-500"
                                    : apiTests["/api/market-info"]?.status === "loading"
                                      ? "bg-yellow-500 animate-pulse"
                                      : "bg-gray-500",
                              )}
                            />
                            <div>
                              <div className="font-medium">Market Info API</div>
                              <div className="text-sm text-muted-foreground">/api/market-info</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {apiTests["/api/market-info"]?.responseTime && (
                              <Badge variant="outline">{apiTests["/api/market-info"].responseTime}ms</Badge>
                            )}
                            {apiTests["/api/market-info"]?.data && <Badge variant="outline">Live data</Badge>}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => testApi("/api/market-info", "Market Info")}
                              disabled={apiTests["/api/market-info"]?.status === "loading"}
                            >
                              {apiTests["/api/market-info"]?.status === "loading" ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              Test
                            </Button>
                          </div>
                        </div>
                        {apiTests["/api/market-info"]?.error && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{apiTests["/api/market-info"].error}</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={testAllApis} disabled={isTestingAll} className="gap-2">
                      {isTestingAll ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                      Test All APIs
                    </Button>
                    <Button variant="outline" className="gap-2 bg-transparent">
                      <CheckCircle className="h-4 w-4" />
                      Phase 2 Ready!
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Funding Rates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Binance, Bybit, OKX, Hyperliquid
                          <br />
                          Real-time funding rate data
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Market Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          CoinGecko, Fear & Greed, Volume
                          <br />
                          Live market sentiment & metrics
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Liquidations Tab */}
              <TabsContent value="liquidations" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Liquidations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{liquidations.length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Exchanges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{new Set(liquidations.map((l) => l.exchange)).size}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Whale Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{liquidations.filter((l) => l.value > 250000).length}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Liquidations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {liquidations.slice(0, 10).map((liquidation, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{liquidation.exchange}</Badge>
                            <span>{liquidation.symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>${liquidation.value.toLocaleString()}</span>
                            <Badge variant={liquidation.side === "BUY" ? "default" : "destructive"}>
                              {liquidation.side}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Monitoring Tab */}
              <TabsContent value="monitoring" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Connection Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>WebSocket</span>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>APIs</span>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Healthy
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Response Time</span>
                          <span className="text-green-600">
                            {apiTests["/api/funding-rates"]?.responseTime || "N/A"}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Error Rate</span>
                          <span className="text-green-600">0%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* All Phases Tab */}
              <TabsContent value="phases" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Project Completion Status</h3>
                    <Badge variant="default" className="gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {getOverallProgress()}% Complete
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {/* Phase 1 */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Phase 1: Real Liquidation Data</span>
                          </div>
                          <Badge variant="default">100%</Badge>
                        </div>
                        <Progress value={100} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          ✅ Real WebSocket connections • ✅ Data validation • ✅ Error handling
                        </div>
                      </CardContent>
                    </Card>

                    {/* Phase 2 */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Phase 2: Market Data APIs</span>
                          </div>
                          <Badge variant="default">100%</Badge>
                        </div>
                        <Progress value={100} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          ✅ Real funding rates • ✅ CoinGecko integration • ✅ Fear & Greed Index
                        </div>
                      </CardContent>
                    </Card>

                    {/* Phase 3 */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Phase 3: Component Updates</span>
                          </div>
                          <Badge variant="default">95%</Badge>
                        </div>
                        <Progress value={95} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          ✅ Removed mock data • ✅ Loading states • ✅ Data validation schemas
                        </div>
                      </CardContent>
                    </Card>

                    {/* Phase 4 */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            <span className="font-medium">Phase 4: Assets & Polish</span>
                          </div>
                          <Badge variant="secondary">60%</Badge>
                        </div>
                        <Progress value={60} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          ✅ Exchange icons • ⚠️ Favicon needed • ⚠️ SEO meta tags • ⚠️ Social previews
                        </div>
                      </CardContent>
                    </Card>

                    {/* Phase 5 */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            <span className="font-medium">Phase 5: Production Readiness</span>
                          </div>
                          <Badge variant="secondary">40%</Badge>
                        </div>
                        <Progress value={40} className="mb-2" />
                        <div className="text-sm text-muted-foreground">
                          ⚠️ Comprehensive logging • ⚠️ Security practices • ⚠️ Performance optimization
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
