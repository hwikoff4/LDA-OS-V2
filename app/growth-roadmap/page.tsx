"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function GrowthRoadmapPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Growth Roadmap"
        description="Plan and track your business growth milestones and strategic initiatives."
      />
    </div>
  )
}
