"use client"
import { getGPTConfig } from "@/lib/gpt-configs"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatLayout } from "@/components/chat-layout"

interface ChatPageProps {
  params: {
    gptId: string
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const gptId = params.gptId as string

  // Get GPT configuration
  const gptConfig = getGPTConfig(gptId)

  if (!gptConfig) {
    return (
      <div className="container mx-auto p-4 h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                GPT configuration not found for ID: {gptId}
                <br />
                <br />
                Available GPTs: legacy-ai, creative-writer, technical-assistant
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ChatLayout gptId={gptConfig.id} />
}
