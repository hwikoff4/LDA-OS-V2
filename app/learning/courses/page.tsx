"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function LearningPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Learning & Community"
        description="Access courses, training materials, and connect with the Legacy Decks Academy community."
      />
    </div>
  )
}
