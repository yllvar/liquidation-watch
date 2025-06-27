import { DateTime } from "luxon"
import type { Liquidation } from "@/lib/types/liquidation"
import { DataValidator } from "@/lib/utils/data-validation"

export class ProductionWebSocketManager {
  private connections = new Map<string, WebSocket>()
  private callbacks: ((liquidation: Liquidation) => void)[] = []
  private reconnectAttempts = new Map<string, number>()
  private maxReconnectAttempts = 10
  private reconnectDelay = 5000
  private connectionStatus = new Map<string, "disconnected" | "connecting" | "connected">()

  constructor(private exchanges: string[]) {
    // Initialize connection status
    exchanges.forEach((exchange) => {
      this.connectionStatus.set(exchange, "disconnected")
    })
  }

  onLiquidation(callback: (liquidation: Liquidation) => void) {
    this.callbacks.push(callback)
  }

  getConnectionStatus() {
    const status: Record<string, string> = {}
    this.connectionStatus.forEach((value, key) => {
      status[key] = value
    })
    return status
  }

  async connect() {
    const endpoints = {
      BINANCE: "wss://fstream.binance.com/ws/!forceOrder@arr",
      BYBIT: "wss://stream.bybit.com/v5/public/linear",
      OKX: "wss://ws.okx.com:8443/ws/v5/public",
    }

    console.log("🔗 Connecting to REAL exchange WebSocket streams...")

    const connectionPromises = this.exchanges.map((exchange) => {
      const endpoint = endpoints[exchange as keyof typeof endpoints]
      if (endpoint) {
        return this.connectToExchange(exchange, endpoint)
      }
      return Promise.reject(new Error(`Unknown exchange: ${exchange}`))
    })

    // Wait for at least one connection to succeed
    try {
      await Promise.allSettled(connectionPromises)
      console.log("✅ WebSocket connection process completed")
    } catch (error) {
      console.error("❌ Error in connection process:", error)
      throw error
    }
  }

  private async connectToExchange(exchange: string, endpoint: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[${exchange}] 🔗 Connecting to ${endpoint}`)
        this.connectionStatus.set(exchange, "connecting")

        // Use native WebSocket for browser environment
        const ws = new WebSocket(endpoint)

        ws.onopen = () => {
          console.log(`[${exchange}] ✅ WebSocket connected successfully`)
          this.connectionStatus.set(exchange, "connected")
          this.reconnectAttempts.set(exchange, 0)
          this.setupExchangeSubscription(ws, exchange)
          resolve()
        }

        ws.onmessage = (event) => {
          try {
            this.handleMessage(exchange, event.data)
          } catch (error) {
            console.error(`[${exchange}] ❌ Error handling message:`, error)
          }
        }

        ws.onerror = (error) => {
          console.error(`[${exchange}] ❌ WebSocket error:`, error)
          this.connectionStatus.set(exchange, "disconnected")
        }

        ws.onclose = (event) => {
          console.log(`[${exchange}] 🔌 WebSocket closed: ${event.code} ${event.reason}`)
          this.connectionStatus.set(exchange, "disconnected")
          this.handleReconnect(exchange, endpoint)
        }

        this.connections.set(exchange, ws)

        // Timeout for connection
        setTimeout(() => {
          if (this.connectionStatus.get(exchange) === "connecting") {
            console.error(`[${exchange}] ⏰ Connection timeout`)
            ws.close()
            reject(new Error(`Connection timeout for ${exchange}`))
          }
        }, 30000)
      } catch (error) {
        console.error(`[${exchange}] ❌ Failed to create WebSocket:`, error)
        this.connectionStatus.set(exchange, "disconnected")
        this.handleReconnect(exchange, endpoint)
        reject(error)
      }
    })
  }

  private setupExchangeSubscription(ws: WebSocket, exchange: string) {
    console.log(`[${exchange}] 📡 Setting up subscriptions...`)

    switch (exchange) {
      case "BYBIT":
        // Subscribe to liquidation streams for major pairs
        const bybitSymbols = [
          "BTCUSDT",
          "ETHUSDT",
          "SOLUSDT",
          "BNBUSDT",
          "XRPUSDT",
          "ADAUSDT",
          "DOGEUSDT",
          "LTCUSDT",
          "DOTUSDT",
          "AVAXUSDT",
          "LINKUSDT",
          "MATICUSDT",
          "UNIUSDT",
          "ATOMUSDT",
        ]

        const bybitSubscription = {
          op: "subscribe",
          args: bybitSymbols.map((symbol) => `liquidation.${symbol}`),
        }

        console.log(`[${exchange}] 📡 Subscribing to ${bybitSymbols.length} liquidation streams`)
        ws.send(JSON.stringify(bybitSubscription))
        break

      case "OKX":
        const okxSubscription = {
          op: "subscribe",
          args: [
            {
              channel: "liquidation-orders",
              instType: "SWAP",
            },
          ],
        }

        console.log(`[${exchange}] 📡 Subscribing to liquidation orders`)
        ws.send(JSON.stringify(okxSubscription))
        break

      case "BINANCE":
        // Binance force order stream is automatic - no subscription needed
        console.log(`[${exchange}] 📡 Force order stream active (automatic)`)
        break
    }
  }

  private handleMessage(exchange: string, message: string) {
    try {
      const data = JSON.parse(message)

      // Skip subscription confirmations and heartbeats
      if (data.success || data.op === "pong" || data.ret_msg) {
        return
      }

      const liquidation = this.parseLiquidation(exchange, data)

      if (liquidation) {
        // Validate the liquidation data
        const validation = DataValidator.validateLiquidation(liquidation)

        if (validation.isValid && validation.data) {
          console.log(`[${exchange}] 💰 Valid liquidation:`, {
            symbol: validation.data.symbol,
            side: validation.data.side,
            value: validation.data.value.toFixed(2),
          })

          this.callbacks.forEach((callback) => callback(validation.data))
        } else {
          console.warn(`[${exchange}] ⚠️ Invalid liquidation data:`, validation.errors)
        }
      }
    } catch (error) {
      // Don't log every parsing error as some messages might be heartbeats
      if (!message.includes("ping") && !message.includes("pong")) {
        console.error(`[${exchange}] ❌ Error parsing message:`, error)
      }
    }
  }

  private parseLiquidation(exchange: string, data: any): Liquidation | null {
    try {
      switch (exchange) {
        case "BINANCE":
          return this.parseBinanceLiquidation(data)
        case "BYBIT":
          return this.parseBybitLiquidation(data)
        case "OKX":
          return this.parseOkxLiquidation(data)
        default:
          return null
      }
    } catch (error) {
      console.error(`[${exchange}] ❌ Error parsing liquidation:`, error)
      return null
    }
  }

  private parseBinanceLiquidation(data: any): Liquidation | null {
    // Binance force order stream format
    if (data.o) {
      const order = data.o
      return {
        exchange: "BINANCE",
        symbol: order.s,
        side: order.S as "BUY" | "SELL",
        orderType: order.o,
        quantity: Number.parseFloat(order.q),
        price: Number.parseFloat(order.ap),
        orderStatus: order.X,
        timestamp: DateTime.fromMillis(Number.parseInt(order.T)),
        value: Number.parseFloat(order.q) * Number.parseFloat(order.ap),
      }
    }
    return null
  }

  private parseBybitLiquidation(data: any): Liquidation | null {
    // Bybit liquidation format
    if (data.topic?.includes("liquidation") && data.data) {
      const liquidationData = data.data
      return {
        exchange: "BYBIT",
        symbol: liquidationData.symbol,
        side: liquidationData.side === "Buy" ? "BUY" : "SELL",
        orderType: "MARKET",
        quantity: Number.parseFloat(liquidationData.size),
        price: Number.parseFloat(liquidationData.price),
        orderStatus: "FILLED",
        timestamp: DateTime.fromMillis(Number.parseInt(liquidationData.updatedTime)),
        value: Number.parseFloat(liquidationData.size) * Number.parseFloat(liquidationData.price),
      }
    }
    return null
  }

  private parseOkxLiquidation(data: any): Liquidation | null {
    // OKX liquidation format
    if (data.arg?.channel === "liquidation-orders" && data.data?.[0]?.details?.[0]) {
      const detail = data.data[0].details[0]
      const instrument = data.data[0]

      return {
        exchange: "OKX",
        symbol: instrument.instId,
        side: detail.side === "buy" ? "BUY" : "SELL",
        orderType: "MARKET",
        quantity: Number.parseFloat(detail.sz),
        price: Number.parseFloat(detail.bkPx),
        orderStatus: "FILLED",
        timestamp: DateTime.fromMillis(Number.parseInt(detail.ts)),
        value: Number.parseFloat(detail.sz) * Number.parseFloat(detail.bkPx),
      }
    }
    return null
  }

  private handleReconnect(exchange: string, endpoint: string) {
    const attempts = this.reconnectAttempts.get(exchange) || 0

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(exchange, attempts + 1)
      const delay = Math.min(this.reconnectDelay * Math.pow(2, attempts), 60000) // Max 1 minute

      console.log(`[${exchange}] 🔄 Reconnecting in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connectToExchange(exchange, endpoint).catch((error) => {
          console.error(`[${exchange}] ❌ Reconnection failed:`, error)
        })
      }, delay)
    } else {
      console.error(`[${exchange}] ❌ Max reconnection attempts reached`)
    }
  }

  disconnect() {
    console.log("🔌 Disconnecting from all exchanges...")
    this.connections.forEach((ws, exchange) => {
      console.log(`[${exchange}] 🔌 Disconnecting...`)
      this.connectionStatus.set(exchange, "disconnected")
      ws.close()
    })
    this.connections.clear()
    this.reconnectAttempts.clear()
  }
}
