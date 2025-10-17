"use client"

import { Sidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { HelpCircle } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-6 w-6 text-lda-red" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Help & Support</h1>
                <p className="text-sm text-gray-600">Get assistance with Legacy Decks Academy Operating System</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 bg-lda-red/10 rounded-full flex items-center justify-center mb-6">
                  <HelpCircle className="w-10 h-10 text-lda-red" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
                <p className="text-gray-600 text-center max-w-md">
                  We're building a comprehensive help center with tutorials, FAQs, and support resources. Check back
                  soon!
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
