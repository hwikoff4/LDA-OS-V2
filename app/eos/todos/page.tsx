"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function TodosPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon title="To-Dos" description="Manage action items and tasks from your EOS meetings." />
    </div>
  )
}
