"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

interface ComingSoonProps {
  title: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-lda-red/10 p-6 mb-6">
            <Construction className="h-12 w-12 text-lda-red" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Coming Soon</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
          {description && <p className="text-gray-600 leading-relaxed">{description}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
