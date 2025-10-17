"use client"
import { Button } from "@/components/ui/button"
import { PlusCircle, MessageSquare, Settings, X, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import type { GPTConfig } from "@/lib/gpt-configs"
import Link from "next/link"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  onNewChat: () => void
  chatHistory: { id: string; title: string }[]
  onSelectChat: (id: string) => void
  currentChatId: string
  gptConfig: GPTConfig
}

export function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  chatHistory,
  onSelectChat,
  currentChatId,
  gptConfig,
}: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed lg:relative top-0 left-0 h-full w-[280px] bg-white border-r border-gray-200 z-50 lg:z-auto"
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-2 lg:hidden">
                <span className="text-sm font-semibold text-gray-700">Menu</span>
                <Button variant="ghost" size="icon" onClick={onToggle} className="text-gray-600 hover:text-gray-900">
                  <X size={20} />
                </Button>
              </div>

              <Link href="/">
                <Button variant="outline" className="w-full mb-2 border-gray-300 hover:bg-gray-50 bg-transparent">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Home
                </Button>
              </Link>

              <Button
                onClick={onNewChat}
                className="flex items-center justify-start gap-2 mb-4 border-gray-300 hover:bg-gray-50 bg-transparent"
                variant="outline"
              >
                <PlusCircle size={16} />
                New Chat
              </Button>

              <div className="flex-1 overflow-y-auto space-y-2 my-4">
                <h2 className="text-sm font-medium mb-2 text-gray-500">Chat History</h2>
                {chatHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No chat history yet</p>
                ) : (
                  chatHistory.map((chat) => (
                    <Button
                      key={chat.id}
                      variant={currentChatId === chat.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left truncate",
                        currentChatId === chat.id
                          ? "font-medium bg-red-50 text-lda-red border-r-2 border-lda-red"
                          : "font-normal text-gray-600 hover:text-lda-red hover:bg-red-50",
                      )}
                      onClick={() => {
                        onSelectChat(chat.id)
                        if (window.innerWidth < 1024) {
                          onToggle()
                        }
                      }}
                    >
                      <MessageSquare size={16} className="mr-2 shrink-0" />
                      <span className="truncate">{chat.title || "New Chat"}</span>
                    </Button>
                  ))
                )}
              </div>

              <div className="mt-auto space-y-2 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                    <Settings size={20} />
                  </Button>
                  <ThemeToggle />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-medium truncate">{gptConfig.name}</span>
                  <span>v1.0.0</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
