"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ExchangeSelectorProps {
  selectedExchanges: string[]
  onExchangeToggle: (exchanges: string[]) => void
}

const availableExchanges = ["BINANCE", "BYBIT", "OKX"]

export function ExchangeSelector({ selectedExchanges, onExchangeToggle }: ExchangeSelectorProps) {
  const { toast } = useToast()

  const toggleExchange = (exchange: string) => {
    if (selectedExchanges.includes(exchange)) {
      if (selectedExchanges.length > 1) {
        const newExchanges = selectedExchanges.filter((ex) => ex !== exchange)
        onExchangeToggle(newExchanges)
        toast({
          title: `${exchange} removed`,
          description: `No longer monitoring ${exchange}`,
        })
      }
    } else {
      const newExchanges = [...selectedExchanges, exchange]
      onExchangeToggle(newExchanges)
      toast({
        title: `${exchange} added`,
        description: `Now monitoring ${exchange}`,
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          Exchanges
          <Badge variant="secondary" className="ml-1">
            {selectedExchanges.length}
          </Badge>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableExchanges.map((exchange) => (
          <DropdownMenuItem
            key={exchange}
            onClick={() => toggleExchange(exchange)}
            className="flex items-center justify-between"
          >
            <span>{exchange}</span>
            {selectedExchanges.includes(exchange) && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
