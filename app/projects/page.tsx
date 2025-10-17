"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { ComingSoon } from "@/components/coming-soon"

export default function ProjectsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ComingSoon
        title="Projects"
        description="Manage your deck building projects, track progress, and collaborate with your team."
      />
    </div>
  )
}
