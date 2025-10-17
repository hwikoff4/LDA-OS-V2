"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function DocumentsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Documents"
        description="Access SOPs, contracts, templates, and all your business documentation in one place."
      />
    </div>
  )
}
