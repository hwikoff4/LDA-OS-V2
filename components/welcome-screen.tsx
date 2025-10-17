"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { getGPTConfig } from "@/lib/gpt-configs"

interface WelcomeScreenProps {
  onStartChat?: (message: string) => void | Promise<void>
  chatId?: string
  gptName?: string
  gptDescription?: string
  gptId?: string
}

export function WelcomeScreen({
  onStartChat,
  chatId,
  gptName = "Legacy AI",
  gptDescription,
  gptId,
}: WelcomeScreenProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Array<{ title: string; question: string }>>([])

  const getGPTQuestions = () => {
    if (!gptId) {
      // Fallback to default questions if no gptId provided
      return [
        {
          title: "Business Strategy",
          question: "How can I improve my deck building business using EOS principles?",
        },
        {
          title: "Operations",
          question: "What's the best way to optimize my deck construction production processes?",
        },
        {
          title: "Pricing Strategy",
          question: "How should I price my deck building services to maximize profitability?",
        },
        {
          title: "Growth Planning",
          question: "How do I create a 90-day growth roadmap for my deck business?",
        },
      ]
    }

    const gptConfig = getGPTConfig(gptId)

    if (gptConfig?.exampleQuestions && gptConfig.exampleQuestions.length > 0) {
      return gptConfig.exampleQuestions
    }

    // Fallback to default questions
    return [
      {
        title: "Business Strategy",
        question: "How can I improve my deck building business using EOS principles?",
      },
      {
        title: "Operations",
        question: "What's the best way to optimize my deck construction production processes?",
      },
      {
        title: "Pricing Strategy",
        question: "How should I price my deck building services to maximize profitability?",
      },
      {
        title: "Growth Planning",
        question: "How do I create a 90-day growth roadmap for my deck business?",
      },
    ]
  }

  // Function to randomly select 4 questions
  const getRandomQuestions = () => {
    const allQuestions = getGPTQuestions()
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 4)
  }

  // Refresh questions when component mounts or chatId/gptId changes
  useEffect(() => {
    setSelectedQuestions(getRandomQuestions())
  }, [chatId, gptId])

  const handleQuestionClick = async (question: string) => {
    if (onStartChat && typeof onStartChat === "function") {
      try {
        await onStartChat(question)
      } catch (error) {
        console.error("Error starting chat with question:", error)
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-6 p-4"
    >
      <div className="flex items-center justify-center">
        <span className="text-4xl font-bold">
          <span className="text-lda-red">Legacy</span>
          <span> Decks Academy</span>
        </span>
      </div>

      <h1 className="text-2xl font-bold">Welcome to {gptName}</h1>

      <p className="text-muted-foreground">
        {gptDescription ||
          `Your AI-powered assistant for all things Legacy Decks Academy. Ask me anything about business strategy,
          operations, team building, or any other business challenge you're facing.`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
        {selectedQuestions.map((example, index) => (
          <motion.button
            key={`${example.title}-${chatId}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            onClick={() => handleQuestionClick(example.question)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-red-50 hover:border-lda-red transition-all duration-200 text-left group cursor-pointer"
          >
            <h3 className="font-medium mb-2 group-hover:text-lda-red transition-colors">{example.title}</h3>
            <p className="text-sm text-muted-foreground">"{example.question}"</p>
          </motion.button>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={() => setSelectedQuestions(getRandomQuestions())}
          className="text-sm text-lda-red hover:text-lda-red-dark transition-colors cursor-pointer underline"
        >
          Show me different examples
        </button>
      </div>
    </motion.div>
  )
}
