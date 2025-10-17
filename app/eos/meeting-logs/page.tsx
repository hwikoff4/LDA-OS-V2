"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function MeetingLogsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon title="Other Meeting Logs" description="Document and track all your business meetings beyond L10s." />
    </div>
  )
}
