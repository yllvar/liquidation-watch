// Dedicated Binance WebSocket service for better reliability
export class BinanceWebSocketService {
  private ws: WebSocket | null = null
  private callbacks: ((data: any) => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 5000

  constructor() {}

  onMessage(callback: (data: any) => void) {
    this.callbacks.push(callback)
  }

  connect() {
    try {
      console.log("Connecting to Binance force order stream...")
      this.ws = new WebSocket("wss://fstream.binance.com/ws/!forceOrder@arr")

      this.ws.onopen = () => {
        console.log("Binance WebSocket connected")
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.callbacks.forEach((callback) => callback(data))
        } catch (error) {
          console.error("Error parsing Binance message:", error)
        }
      }

      this.ws.onerror = (error) => {
        console.error("Binance WebSocket error:", error)
      }

      this.ws.onclose = (event) => {
        console.log("Binance WebSocket closed:", event.code, event.reason)
        this.handleReconnect()
      }
    } catch (error) {
      console.error("Failed to connect to Binance:", error)
      this.handleReconnect()
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(
        `Reconnecting to Binance in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
      )

      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay)
    } else {
      console.error("Max reconnection attempts reached for Binance")
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
