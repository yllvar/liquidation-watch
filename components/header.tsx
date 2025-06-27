"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserGuideModal } from "@/components/user-guide-modal"
import { TrendingUp } from "lucide-react"

export function Header() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Liquidation Watch</span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button onClick={() => setShowGuide(true)}>Get Started</Button>
          </div>
        </div>
      </header>

      <UserGuideModal open={showGuide} onOpenChange={setShowGuide} />
    </>
  )
}
