import { Suspense } from "react"
import { GPTsDashboard } from "@/components/gpts-dashboard"

function GPTsDashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-lda-red border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading GPTs Dashboard...</p>
      </div>
    </div>
  )
}

export default function GPTsDashboardPage() {
  return (
    <Suspense fallback={<GPTsDashboardLoading />}>
      <GPTsDashboard />
    </Suspense>
  )
}
