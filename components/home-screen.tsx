"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Star, MessageSquare, Code, BookOpen, Lightbulb, Briefcase } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { type GPTConfig, getGPTConfigs } from "@/lib/gpt-configs"

export function HomeScreen() {
  const [gptConfigs, setGptConfigs] = useState<GPTConfig[]>([])

  useEffect(() => {
    setGptConfigs(getGPTConfigs())
  }, [])

  const getIcon = (iconName: string) => {
    const icons = {
      MessageSquare,
      Code,
      BookOpen,
      Lightbulb,
      Briefcase,
    }
    const Icon = icons[iconName as keyof typeof icons] || MessageSquare
    return <Icon size={24} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              <span className="text-blue-500">Elite</span>
              <span className="text-green-500">Chat</span>
            </span>
            <Badge variant="secondary">Multi-GPT Platform</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <Settings size={20} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Choose Your AI Assistant</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select from our collection of specialized AI assistants, each designed for specific tasks and expertise.
          </p>
        </motion.div>

        {/* Featured GPT - Legacy AI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative">
            <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Star className="text-yellow-500 mr-2" size={32} />
                  <CardTitle className="text-3xl">Legacy AI</CardTitle>
                  <Badge className="ml-2">Featured</Badge>
                </div>
                <CardDescription className="text-lg">
                  Your comprehensive business AI assistant with access to all Legacy Decks Academy resources
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href="/chat/legacy-ai">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Ask Legacy AI
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Other GPTs Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Specialized Assistants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gptConfigs
              .filter((gpt) => gpt.id !== "elite-chat")
              .map((gpt, index) => (
                <motion.div
                  key={gpt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="text-primary">{getIcon(gpt.icon)}</div>
                        <CardTitle className="text-xl">{gpt.name}</CardTitle>
                      </div>
                      <CardDescription>{gpt.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {gpt.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Link href={`/chat/${gpt.id}`}>
                        <Button className="w-full">Start Chat</Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
