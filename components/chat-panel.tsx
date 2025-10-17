"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, RefreshCw, Menu } from "lucide-react"
import { ChatMessage } from "@/components/chat-message"
import { WelcomeScreen } from "@/components/welcome-screen"
import type { GPTConfig } from "@/lib/gpt-configs"
import { nanoid } from "nanoid"

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatPanelProps {
  chatId: string
  onSaveChatTitle: (title: string) => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
  gptConfig: GPTConfig
}

export function ChatPanel({ chatId, onSaveChatTitle, isSidebarOpen, toggleSidebar, gptConfig }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Save the first user message as the chat title
  useEffect(() => {
    if (isFirstMessage && messages.length > 0 && messages[0].role === "user") {
      const title = messages[0].content.substring(0, 30)
      onSaveChatTitle(title)
      setIsFirstMessage(false)
    }
  }, [messages, isFirstMessage, onSaveChatTitle])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent?.trim() || isLoading) return

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: messageContent.trim(),
    }

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessageId = nanoid()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          gptId: gptConfig?.id || "legacy-ai",
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No response body")
      }

      let accumulatedContent = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        accumulatedContent += chunk

        // Update the assistant message with accumulated content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedContent,
                }
              : msg,
          ),
        )
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request aborted")
      } else {
        console.error("Chat error:", error)
        // Update the assistant message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `Sorry, there was an error processing your message: ${error.message || "Unknown error"}. Please try again.`,
                }
              : msg,
          ),
        )
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await sendMessage(input)
  }

  const handleStartChat = async (message: string) => {
    if (!message?.trim()) return
    await sendMessage(message)
  }

  const handleReload = async () => {
    if (messages.length === 0) return

    // Find the last user message
    const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user")
    if (lastUserMessageIndex === -1) return

    const lastUserMessage = messages[lastUserMessageIndex]

    // Remove all messages after the last user message
    setMessages((prev) => prev.slice(0, lastUserMessageIndex + 1))

    // Resend the last user message
    await sendMessage(lastUserMessage.content)
  }

  return (
    <div className="flex flex-col h-full relative bg-gray-50">
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-gray-600 hover:text-gray-900">
          <Menu size={24} />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{gptConfig?.name || "AI Assistant"}</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <WelcomeScreen
            onStartChat={handleStartChat}
            chatId={chatId}
            gptName={gptConfig?.name || "AI Assistant"}
            gptDescription={gptConfig?.description || "A helpful AI assistant"}
            gptId={gptConfig?.id}
          />
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} gptName={gptConfig?.name || "AI Assistant"} />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="animate-pulse">🤖</span>
                </div>
                <div className="flex space-x-2">
                  <span
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></span>
                  <span
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></span>
                  <span
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t p-4 bg-white">
        <form onSubmit={handleFormSubmit} className="max-w-3xl mx-auto relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${gptConfig?.name || "AI Assistant"}...`}
            className="pr-20 py-6 border-gray-200 bg-white focus:ring-lda-red focus:border-lda-red placeholder:text-gray-500"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {messages.length > 0 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleReload}
                disabled={isLoading}
                className="text-gray-500 hover:text-lda-red"
              >
                <RefreshCw size={18} />
              </Button>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={!input?.trim() || isLoading}
              className="bg-lda-red hover:bg-lda-red-dark text-white"
            >
              <Send size={18} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
