import { WebSocket } from "ws"
import { DateTime } from "luxon"
import type { Liquidation } from "@/lib/types/liquidation"

export class WebSocketManager {
  private connections = new Map<string, WebSocket>()
  private callbacks: ((liquidation: Liquidation) => void)[] = []
  private reconnectAttempts = new Map<string, number>()
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000

  constructor(private exchanges: string[]) {}

  onLiquidation(callback: (liquidation: Liquidation) => void) {
    this.callbacks.push(callback)
  }

  connect() {
    const endpoints = {
      BINANCE: "wss://fstream.binance.com/ws/!forceOrder@arr",
      BYBIT: "wss://stream.bybit.com/v5/public/linear",
      OKX: "wss://ws.okx.com:8443/ws/v5/public",
    }

    this.exchanges.forEach((exchange) => {
      this.connectToExchange(exchange, endpoints[exchange as keyof typeof endpoints])
    })
  }

  private connectToExchange(exchange: string, endpoint: string) {
    try {
      console.log(`Connecting to ${exchange} at ${endpoint}`)
      const ws = new WebSocket(endpoint)

      ws.on("open", () => {
        console.log(`${exchange} WebSocket connected`)
        this.reconnectAttempts.set(exchange, 0)
        this.setupExchangeSubscription(ws, exchange)
      })

      ws.on("message", (data) => {
        try {
          this.handleMessage(exchange, data.toString())
        } catch (error) {
          console.error(`Error handling ${exchange} message:`, error)
        }
      })

      ws.on("error", (error) => {
        console.error(`${exchange} WebSocket error:`, error)
      })

      ws.on("close", (code, reason) => {
        console.log(`${exchange} WebSocket closed: ${code} ${reason}`)
        this.handleReconnect(exchange, endpoint)
      })

      this.connections.set(exchange, ws)
    } catch (error) {
      console.error(`Failed to connect to ${exchange}:`, error)
      this.handleReconnect(exchange, endpoint)
    }
  }

  private handleReconnect(exchange: string, endpoint: string) {
    const attempts = this.reconnectAttempts.get(exchange) || 0

    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(exchange, attempts + 1)
      console.log(
        `Reconnecting to ${exchange} in ${this.reconnectDelay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`,
      )

      setTimeout(() => {
        this.connectToExchange(exchange, endpoint)
      }, this.reconnectDelay)
    } else {
      console.error(`Max reconnection attempts reached for ${exchange}`)
    }
  }

  disconnect() {
    this.connections.forEach((ws, exchange) => {
      console.log(`Disconnecting from ${exchange}`)
      ws.close()
    })
    this.connections.clear()
    this.reconnectAttempts.clear()
  }

  private setupExchangeSubscription(ws: WebSocket, exchange: string) {
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
        ]

        ws.send(
          JSON.stringify({
            op: "subscribe",
            args: bybitSymbols.map((symbol) => `liquidation.${symbol}`),
          }),
        )
        break

      case "OKX":
        // Subscribe to liquidation orders
        ws.send(
          JSON.stringify({
            op: "subscribe",
            args: [
              {
                channel: "liquidation-orders",
                instType: "SWAP",
              },
            ],
          }),
        )
        break

      case "BINANCE":
        // Binance force order stream doesn't need subscription
        // It automatically sends all liquidations
        break
    }
  }

  private handleMessage(exchange: string, message: string) {
    try {
      const data = JSON.parse(message)
      const liquidation = this.parseLiquidation(exchange, data)

      if (liquidation) {
        console.log(`${exchange} liquidation:`, liquidation)
        this.callbacks.forEach((callback) => callback(liquidation))
      }
    } catch (error) {
      console.error(`Error parsing ${exchange} message:`, error)
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
      console.error(`Error parsing ${exchange} liquidation:`, error)
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
}
