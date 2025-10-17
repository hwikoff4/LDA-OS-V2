"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function VisionGoalsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Vision & Goals"
        description="Define your company vision, core values, and long-term strategic goals."
      />
    </div>
  )
}
