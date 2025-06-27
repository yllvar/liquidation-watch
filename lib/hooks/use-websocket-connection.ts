"use client"

import { useEffect, useRef } from "react"
import { useLiquidationStore } from "@/lib/stores/liquidation-store"
import { useToast } from "@/hooks/use-toast"

export function useWebSocketConnection(exchanges: string[]) {
  const addLiquidation = useLiquidationStore((state) => state.addLiquidation)
  const { toast } = useToast()
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    // Only run on client side
    if (typeof window === "undefined") return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const exchangeParams = exchanges.join(",")
    console.log("Connecting to liquidation stream with exchanges:", exchangeParams)

    const eventSource = new EventSource(`/api/liquidations/stream?exchanges=${exchangeParams}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log("EventSource connection opened")
      reconnectAttempts.current = 0
      toast({
        title: "Connected",
        description: `Connected to ${exchanges.length} exchange(s)`,
        duration: 3000,
      })
    }

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case "connection":
            console.log("Connection established:", message.message)
            break

          case "liquidation":
            console.log("Received liquidation:", message.data)
            addLiquidation(message.data)
            break

          case "heartbeat":
            console.log("Heartbeat received")
            break

          case "error":
            console.error("Server error:", message.message)
            toast({
              title: "Connection Error",
              description: message.message,
              variant: "destructive",
            })
            break

          default:
            console.log("Unknown message type:", message)
        }
      } catch (error) {
        console.error("Error parsing liquidation data:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error)

      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("EventSource connection closed")

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)

          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`,
          )

          toast({
            title: "Connection Lost",
            description: `Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`,
            variant: "destructive",
          })

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          toast({
            title: "Connection Failed",
            description: "Unable to connect to liquidation stream. Please refresh the page.",
            variant: "destructive",
          })
        }
      }
    }
  }

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return

    connect()

    return () => {
      console.log("Cleaning up WebSocket connection")
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [exchanges.join(",")]) // Reconnect when exchanges change

  return {
    reconnect: connect,
    isConnected: typeof window !== "undefined" && eventSourceRef.current?.readyState === EventSource.OPEN,
  }
}
