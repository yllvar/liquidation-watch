import type { NextRequest } from "next/server"
import { ProductionWebSocketManager } from "@/lib/services/production-websocket-manager"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const exchanges = searchParams.get("exchanges")?.split(",") || ["BINANCE", "BYBIT", "OKX"]

  console.log("🚀 Starting REAL liquidation stream for exchanges:", exchanges)

  // Create Server-Sent Events stream with REAL WebSocket connections
  const stream = new ReadableStream({
    start(controller) {
      const wsManager = new ProductionWebSocketManager(exchanges)
      let isConnected = true

      // Send message helper
      const sendMessage = (data: any) => {
        if (isConnected) {
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(new TextEncoder().encode(message))
          } catch (error) {
            console.error("❌ Error sending message:", error)
          }
        }
      }

      // Send initial connection message
      sendMessage({
        type: "connection",
        message: "🔗 Connecting to REAL exchange WebSocket streams...",
        exchanges,
        timestamp: new Date().toISOString(),
      })

      // Handle real liquidation data
      wsManager.onLiquidation((liquidation) => {
        console.log(`💰 REAL liquidation from ${liquidation.exchange}:`, {
          symbol: liquidation.symbol,
          side: liquidation.side,
          value: liquidation.value,
        })

        sendMessage({
          type: "liquidation",
          data: liquidation,
          timestamp: new Date().toISOString(),
        })
      })

      // Connect to REAL exchanges
      wsManager
        .connect()
        .then(() => {
          sendMessage({
            type: "connection",
            message: "✅ Connected to REAL exchange streams!",
            exchanges,
            timestamp: new Date().toISOString(),
          })
        })
        .catch((error) => {
          console.error("❌ Error connecting to exchanges:", error)
          sendMessage({
            type: "error",
            message: `Failed to connect to exchanges: ${error.message}`,
            error: error.message,
          })
        })

      // Send periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        if (isConnected) {
          sendMessage({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
            exchanges,
            connections: wsManager.getConnectionStatus(),
          })
        }
      }, 30000) // Every 30 seconds

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        console.log("🔌 Client disconnected, cleaning up REAL connections...")
        isConnected = false
        clearInterval(heartbeatInterval)
        wsManager.disconnect()
        try {
          controller.close()
        } catch (error) {
          console.error("Error closing controller:", error)
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
