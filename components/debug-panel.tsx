"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLiquidationStore } from "@/lib/stores/liquidation-store"
import { Bug, Activity, Database, Wifi, RefreshCw, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface DebugPanelProps {
  isVisible: boolean
  onClose: () => void
}

export function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const [connectionLogs, setConnectionLogs] = useState<string[]>([])
  const [dataLogs, setDataLogs] = useState<any[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [realDataCount, setRealDataCount] = useState(0)
  const liquidations = useLiquidationStore((state) => state.liquidations)

  useEffect(() => {
    if (!isVisible) return

    // Test REAL EventSource connection
    const testConnection = () => {
      setConnectionStatus("connecting")
      addLog("🚀 Testing REAL EventSource connection...")

      const eventSource = new EventSource("/api/liquidations/stream?exchanges=BINANCE,BYBIT,OKX")

      eventSource.onopen = () => {
        setConnectionStatus("connected")
        addLog("✅ REAL EventSource connection opened successfully")
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          addLog(`📨 Received: ${data.type}`)
          addDataLog(data)

          if (data.type === "liquidation") {
            setRealDataCount((prev) => prev + 1)
            addLog(
              `💰 REAL Liquidation #${realDataCount + 1}: ${data.data.exchange} ${data.data.symbol} ${data.data.side} $${data.data.value.toFixed(2)}`,
            )
          }

          if (data.type === "connection") {
            addLog(`🔗 Connection: ${data.message}`)
          }

          if (data.type === "heartbeat") {
            addLog(`💓 Heartbeat - Connections: ${JSON.stringify(data.connections || {})}`)
          }
        } catch (error) {
          addLog(`❌ Error parsing message: ${error}`)
        }
      }

      eventSource.onerror = (error) => {
        setConnectionStatus("disconnected")
        addLog(`❌ REAL EventSource error: ${error}`)
        console.error("EventSource error:", error)
      }

      return () => {
        eventSource.close()
        setConnectionStatus("disconnected")
      }
    }

    const cleanup = testConnection()
    return cleanup
  }, [isVisible, realDataCount])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConnectionLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 100))
  }

  const addDataLog = (data: any) => {
    setDataLogs((prev) => [{ timestamp: new Date().toISOString(), ...data }, ...prev].slice(0, 50))
  }

  const clearLogs = () => {
    setConnectionLogs([])
    setDataLogs([])
    setRealDataCount(0)
  }

  const testApiEndpoint = async () => {
    try {
      addLog("🧪 Testing API endpoint...")
      const response = await fetch("/api/liquidations/stream?exchanges=BINANCE")
      addLog(`API Response Status: ${response.status}`)
      addLog(`API Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
    } catch (error) {
      addLog(`API Test Error: ${error}`)
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Panel - REAL DATA MODE
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                connectionStatus === "connected"
                  ? "default"
                  : connectionStatus === "connecting"
                    ? "secondary"
                    : "destructive"
              }
              className="gap-1"
            >
              <Wifi className="h-3 w-3" />
              {connectionStatus.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Zap className="h-3 w-3" />
              {realDataCount} REAL
            </Badge>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="connection" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="connection">Real Connection</TabsTrigger>
              <TabsTrigger value="data">Real Data Flow</TabsTrigger>
              <TabsTrigger value="store">Store State</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="flex-1 mt-4">
              <div className="space-y-4 h-full">
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    <strong>REAL Connection Status:</strong> {connectionStatus}
                    <br />
                    <strong>Real Liquidations Received:</strong> {realDataCount}
                    <br />
                    <strong>Total Logs:</strong> {connectionLogs.length}
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[400px] border rounded p-4">
                  <div className="space-y-1 font-mono text-sm">
                    {connectionLogs.map((log, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-1 rounded",
                          log.includes("✅") && "text-green-600 bg-green-50 dark:bg-green-950",
                          log.includes("❌") && "text-red-600 bg-red-50 dark:bg-red-950",
                          log.includes("📨") && "text-blue-600 bg-blue-50 dark:bg-blue-950",
                          log.includes("💰") && "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 font-bold",
                          log.includes("🚀") && "text-purple-600 bg-purple-50 dark:bg-purple-950",
                        )}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="data" className="flex-1 mt-4">
              <div className="space-y-4 h-full">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Real Data Messages:</strong> {dataLogs.length}
                    <br />
                    <strong>Real Liquidations:</strong> {dataLogs.filter((log) => log.type === "liquidation").length}
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[400px] border rounded p-4">
                  <div className="space-y-2">
                    {dataLogs.map((log, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-2 border rounded",
                          log.type === "liquidation" && "bg-green-50 dark:bg-green-950 border-green-200",
                          log.type === "connection" && "bg-blue-50 dark:bg-blue-950 border-blue-200",
                          log.type === "heartbeat" && "bg-gray-50 dark:bg-gray-950 border-gray-200",
                        )}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant={log.type === "liquidation" ? "default" : "secondary"}>{log.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(log, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="store" className="flex-1 mt-4">
              <div className="space-y-4 h-full">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Liquidations in Store:</strong> {liquidations.length}
                    <br />
                    <strong>Real vs Mock:</strong> All data should now be REAL from exchanges!
                  </AlertDescription>
                </Alert>

                <ScrollArea className="h-[400px] border rounded p-4">
                  <div className="space-y-2">
                    {liquidations.slice(0, 20).map((liquidation, index) => (
                      <div key={index} className="p-2 border rounded bg-muted/50">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="outline" className="gap-1">
                            <Zap className="h-3 w-3" />
                            {liquidation.exchange}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {typeof liquidation.timestamp === "string"
                              ? new Date(liquidation.timestamp).toLocaleTimeString()
                              : liquidation.timestamp?.toFormat?.("HH:mm:ss") || "Invalid time"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <strong>{liquidation.symbol}</strong> {liquidation.side}
                          <span className="ml-2 font-mono text-green-600">${liquidation.value.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={testApiEndpoint} variant="outline">
                    Test REAL API Endpoint
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Reload Page
                  </Button>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>🚀 REAL DATA MODE ACTIVE!</strong>
                    <br />• User Agent: {navigator.userAgent.slice(0, 50)}...
                    <br />• Online: {navigator.onLine ? "✅ Yes" : "❌ No"}
                    <br />• EventSource Support: {typeof EventSource !== "undefined" ? "✅ Yes" : "❌ No"}
                    <br />• Real Liquidations: {realDataCount}
                    <br />• Current URL: {window.location.href}
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
