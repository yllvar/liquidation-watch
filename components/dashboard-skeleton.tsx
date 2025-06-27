import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 space-y-6">
        {/* Header Skeleton */}
        <Card className="sticky top-2 z-50 border shadow-lg">
          <div className="p-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <Card>
          <CardContent className="p-6">
            {/* Tabs Skeleton */}
            <div className="flex space-x-1 mb-6">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Table Skeleton */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>

              <div className="space-y-2">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
