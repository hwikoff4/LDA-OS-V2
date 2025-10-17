"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function CalendarPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Calendar"
        description="Schedule meetings, track deadlines, and manage your business calendar."
      />
    </div>
  )
}
