"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function IssuesPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Issues List"
        description="Track and resolve business issues using the EOS Issues Solving Track."
      />
    </div>
  )
}
