"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  exchanges: string[]
}

export function ConnectionStatus({ exchanges }: ConnectionStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    // Listen for connection events
    const handleOnline = () => setConnectionStatus("connected")
    const handleOffline = () => setConnectionStatus("disconnected")

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial connection status
    setConnectionStatus(navigator.onLine ? "connecting" : "disconnected")

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [isClient])

  const getStatusProps = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          variant: "default" as const,
          text: "LIVE",
          icon: CheckCircle,
          className: "bg-green-500/10 text-green-500 border-green-500/20",
        }
      case "connecting":
        return {
          variant: "secondary" as const,
          text: "CONNECTING",
          icon: Clock,
          className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        }
      case "disconnected":
        return {
          variant: "destructive" as const,
          text: "OFFLINE",
          icon: AlertCircle,
          className: "bg-red-500/10 text-red-500 border-red-500/20",
        }
    }
  }

  const statusProps = getStatusProps()
  const StatusIcon = statusProps.icon

  if (!isClient) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <Clock className="h-3 w-3" />
          LOADING
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={cn("gap-1", statusProps.className)}>
        <StatusIcon className="h-3 w-3" />
        {statusProps.text}
      </Badge>

      <div className="flex items-center gap-1">
        {navigator.onLine ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
        <span className="text-xs text-muted-foreground">
          {exchanges.length} exchange{exchanges.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}
