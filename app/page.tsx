import { Dashboard } from "@/components/dashboard"
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}
