"use client"
import { motion } from "framer-motion"
import type { Message } from "ai"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  gptName?: string
}

export function ChatMessage({ message, gptName }: ChatMessageProps) {
  const isUser = message.role === "user"

  // Simple function to format text with basic markdown-like formatting
  const formatText = (text: string) => {
    // Split by lines and process each line
    const lines = text.split("\n")

    return lines.map((line, index) => {
      // Handle code blocks (lines starting with 4 spaces or tabs)
      if (line.startsWith("    ") || line.startsWith("\t")) {
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm font-mono overflow-x-auto my-2">
            <code>{line.trim()}</code>
          </pre>
        )
      }

      // Handle headers
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-xl font-bold mt-4 mb-2">
            {line.substring(2)}
          </h1>
        )
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-lg font-bold mt-3 mb-2">
            {line.substring(3)}
          </h2>
        )
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-base font-bold mt-2 mb-1">
            {line.substring(4)}
          </h3>
        )
      }

      // Handle bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={index} className="ml-4 list-disc">
            {formatInlineText(line.substring(2))}
          </li>
        )
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-4 list-decimal">
            {formatInlineText(line.replace(/^\d+\.\s/, ""))}
          </li>
        )
      }

      // Handle empty lines
      if (line.trim() === "") {
        return <br key={index} />
      }

      // Regular paragraph
      return (
        <p key={index} className="mb-2">
          {formatInlineText(line)}
        </p>
      )
    })
  }

  // Format inline text with bold, italic, and inline code
  const formatInlineText = (text: string) => {
    // Handle inline code first (backticks)
    const parts = text.split(/(`[^`]+`)/)

    return parts.map((part, index) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
            {part.slice(1, -1)}
          </code>
        )
      }

      // Handle bold text (**text**)
      const boldParts = part.split(/(\*\*[^*]+\*\*)/)
      return boldParts.map((boldPart, boldIndex) => {
        if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
          return <strong key={`${index}-${boldIndex}`}>{boldPart.slice(2, -2)}</strong>
        }

        // Handle italic text (*text*)
        const italicParts = boldPart.split(/(\*[^*]+\*)/)
        return italicParts.map((italicPart, italicIndex) => {
          if (italicPart.startsWith("*") && italicPart.endsWith("*") && !italicPart.startsWith("**")) {
            return <em key={`${index}-${boldIndex}-${italicIndex}`}>{italicPart.slice(1, -1)}</em>
          }
          return italicPart
        })
      })
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-start gap-4 max-w-3xl", isUser ? "ml-auto" : "mr-auto")}
    >
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
          isUser ? "bg-lda-red text-white" : "bg-gray-100 text-gray-600",
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="flex-1 space-y-2">
        <div className="font-medium">{isUser ? "You" : gptName || "AI Assistant"}</div>
        <div className="prose prose-sm dark:prose-invert max-w-none">{formatText(message.content)}</div>
      </div>
    </motion.div>
  )
}
