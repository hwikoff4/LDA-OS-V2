"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function L10MeetingsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="L10 Meeting Tracker"
        description="Run effective Level 10 meetings and track your team's weekly progress."
      />
    </div>
  )
}
