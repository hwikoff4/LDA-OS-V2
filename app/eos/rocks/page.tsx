"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function RocksPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Rocks"
        description="Set and track your quarterly priorities and goals using the EOS Rocks framework."
      />
    </div>
  )
}
