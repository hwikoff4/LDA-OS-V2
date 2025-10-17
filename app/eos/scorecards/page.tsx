"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function ScorecardsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Scorecards"
        description="Track your key performance indicators and measure business health with EOS scorecards."
      />
    </div>
  )
}
