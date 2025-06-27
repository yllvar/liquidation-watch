"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function TableLoadingSkeleton({ className, size = "md" }: LoadingStateProps) {
  const rows = size === "sm" ? 5 : size === "md" ? 8 : 12

  return (
    <div className={cn("space-y-2", className)}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex justify-between items-center p-3 border rounded">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CardLoadingSkeleton({ className, size = "md" }: LoadingStateProps) {
  const height = size === "sm" ? "h-20" : size === "md" ? "h-24" : "h-32"

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn("w-16 mb-2", height === "h-20" ? "h-6" : height === "h-24" ? "h-8" : "h-10")} />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function GridLoadingSkeleton({ className, count = 4 }: LoadingStateProps & { count?: number }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {[...Array(count)].map((_, i) => (
        <CardLoadingSkeleton key={i} />
      ))}
    </div>
  )
}

export function FundingRatesLoadingSkeleton({ className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function MarketInfoLoadingSkeleton({ className }: LoadingStateProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <GridLoadingSkeleton count={4} />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-4 w-8 mx-auto" />
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-1 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function InlineLoading({ text = "Loading...", size = "md", className }: InlineLoadingProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"
  const textSize = size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"

  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <Loader2 className={cn("animate-spin", iconSize)} />
      <span className={textSize}>{text}</span>
    </div>
  )
}

export function ConnectionLoading({ exchanges }: { exchanges: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting
      </Badge>
      <div className="flex items-center gap-1">
        <Wifi className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {exchanges.length} exchange{exchanges.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  )
}

export function DataRefreshing({ text = "Refreshing data..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span className="text-xs font-medium">{text}</span>
    </div>
  )
}
