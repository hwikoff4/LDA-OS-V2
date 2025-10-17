"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChatPanel } from "@/components/chat-panel"
import { nanoid } from "nanoid"
import { motion } from "framer-motion"
import { getGPTConfig, type GPTConfig } from "@/lib/gpt-configs"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ChatLayoutProps {
  gptId: string
}

export function ChatLayout({ gptId }: ChatLayoutProps) {
  const [chatId, setChatId] = useState<string>("")
  const [chatHistory, setChatHistory] = useState<{ id: string; title: string }[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [gptConfig, setGptConfig] = useState<GPTConfig | null>(null)

  // Load GPT configuration
  useEffect(() => {
    const config = getGPTConfig(gptId)
    setGptConfig(config)
  }, [gptId])

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024)
    }

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Initialize chat ID and load chat history from localStorage
  useEffect(() => {
    const newChatId = nanoid()
    setChatId(newChatId)

    const storedHistory = localStorage.getItem(`chatHistory-${gptId}`)
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory))
    }
  }, [gptId])

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(`chatHistory-${gptId}`, JSON.stringify(chatHistory))
    }
  }, [chatHistory, gptId])

  const handleNewChat = () => {
    const newChatId = nanoid()
    setChatId(newChatId)
  }

  const handleSelectChat = (id: string) => {
    setChatId(id)
  }

  const handleSaveChatTitle = (title: string) => {
    setChatHistory((prev) => {
      const existingChatIndex = prev.findIndex((chat) => chat.id === chatId)

      if (existingChatIndex !== -1) {
        const updatedHistory = [...prev]
        updatedHistory[existingChatIndex] = { ...updatedHistory[existingChatIndex], title }
        return updatedHistory
      } else {
        return [...prev, { id: chatId, title }]
      }
    })
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  if (!gptConfig) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white border border-gray-200 shadow-sm p-8 rounded-md">
          <h1 className="text-2xl font-bold mb-4">GPT Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested GPT configuration could not be found.</p>
          <Link href="/">
            <Button className="bg-lda-red hover:bg-lda-red-dark text-white">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 relative overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
        chatHistory={chatHistory}
        onSelectChat={handleSelectChat}
        currentChatId={chatId}
        gptConfig={gptConfig}
      />
      <motion.div
        className="flex-1 overflow-hidden w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ChatPanel
          chatId={chatId}
          onSaveChatTitle={handleSaveChatTitle}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          gptConfig={gptConfig}
        />
      </motion.div>
    </div>
  )
}
