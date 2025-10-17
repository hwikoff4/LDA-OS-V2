"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function AccountabilityPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Accountability Chart"
        description="Define roles, responsibilities, and organizational structure with the EOS Accountability Chart."
      />
    </div>
  )
}
