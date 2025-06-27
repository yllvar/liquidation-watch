"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { MainTabs } from "@/components/main-tabs"
import { AdminPanel } from "@/components/admin-panel"
import { Footer } from "@/components/footer"
import { useWebSocketConnection } from "@/lib/hooks/use-websocket-connection"
import { useToast } from "@/hooks/use-toast"

export function Dashboard() {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [selectedExchanges, setSelectedExchanges] = useState(["BINANCE", "BYBIT", "OKX"])
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const { toast } = useToast()

  // Initialize WebSocket connection
  useWebSocketConnection(selectedExchanges)

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundPreference = localStorage.getItem("soundEnabled")
    if (savedSoundPreference !== null) {
      setSoundEnabled(JSON.parse(savedSoundPreference))
    }
  }, [])

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem("soundEnabled", JSON.stringify(soundEnabled))
  }, [soundEnabled])

  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled)
    toast({
      title: soundEnabled ? "Sound Disabled" : "Sound Enabled",
      description: soundEnabled
        ? "You will no longer hear whale alert notifications"
        : "You will now hear whale alert notifications",
      duration: 2000,
    })
  }

  const handleExchangeChange = (exchanges: string[]) => {
    setSelectedExchanges(exchanges)
    toast({
      title: "Exchanges Updated",
      description: `Now monitoring ${exchanges.length} exchange${exchanges.length !== 1 ? "s" : ""}`,
      duration: 2000,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        soundEnabled={soundEnabled}
        onSoundToggle={handleSoundToggle}
        selectedExchanges={selectedExchanges}
        onExchangeChange={handleExchangeChange}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      <main className="container mx-auto p-4 space-y-6">
        <MainTabs soundEnabled={soundEnabled} />
      </main>

      <Footer selectedExchanges={selectedExchanges} soundEnabled={soundEnabled} />

      <AdminPanel isOpen={showAdminPanel} onClose={() => setShowAdminPanel(false)} />
    </div>
  )
}
