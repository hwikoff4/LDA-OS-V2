"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Bot,
  Search,
  Star,
  Users,
  TrendingUp,
  DollarSign,
  Cog,
  GraduationCap,
  Video,
  Calculator,
  UserCheck,
  Settings,
  Plus,
  Check,
  ArrowRight,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/dashboard-sidebar"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { type GPTConfig, getGPTConfigs } from "@/lib/gpt-configs"

export function GPTsDashboard() {
  const [gptConfigs, setGptConfigs] = useState<GPTConfig[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedGPT, setSelectedGPT] = useState<GPTConfig | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const categoryParam = searchParams.get("category")

  useEffect(() => {
    console.log("[v0] Loading GPT configs from localStorage and defaults")
    const configs = getGPTConfigs()
    console.log("[v0] Loaded GPT configs:", configs.length, "total GPTs")
    console.log(
      "[v0] GPT IDs:",
      configs.map((g) => g.id),
    )
    console.log(
      "[v0] Operations and Team GPTs:",
      configs.filter((g) => g.category === "Operations and Team").map((g) => g.name),
    )
    setGptConfigs(configs)
    const legacyAI = configs.find((gpt) => gpt.id === "legacy-ai")
    if (legacyAI) {
      setSelectedGPT(legacyAI)
    }
  }, []) // Only run once on mount

  useEffect(() => {
    if (categoryParam) {
      const categoryMap: Record<string, string> = {
        Core: "Core business",
        Operations: "Operations and Team",
        Marketing: "Marketing and Client Experience",
      }
      const fullCategoryName = categoryMap[categoryParam] || "All"
      setSelectedCategory(fullCategoryName)
    }
  }, [categoryParam]) // Only depend on the string value, not the searchParams object

  const getIcon = (iconName: string) => {
    const icons = {
      MessageSquare,
      Bot,
      Users,
      TrendingUp,
      DollarSign,
      Cog,
      GraduationCap,
      Video,
      Calculator,
      UserCheck,
    }
    const Icon = icons[iconName as keyof typeof icons] || MessageSquare
    return Icon
  }

  const categories = ["All", "Core business", "Operations and Team", "Marketing and Client Experience"]

  const filteredGPTs = gptConfigs.filter((gpt) => {
    const matchesSearch =
      gpt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gpt.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || gpt.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const gptsByCategory = {
    featured: filteredGPTs.filter((gpt) => gpt.featured),
    "Core business": filteredGPTs.filter((gpt) => gpt.category === "Core business"),
    "Operations and Team": filteredGPTs.filter((gpt) => gpt.category === "Operations and Team"),
    "Marketing and Client Experience": filteredGPTs.filter((gpt) => gpt.category === "Marketing and Client Experience"),
    "AI Tools": filteredGPTs.filter((gpt) => gpt.category === "AI Tools"),
  }

  const handleGPTSelect = (gpt: GPTConfig) => {
    router.push(`/chat/${gpt.id}`)
  }

  const handleStartChat = () => {
    if (selectedGPT) {
      router.push(`/chat/${selectedGPT.id}`)
    }
  }

  const renderGPTCard = (gpt: GPTConfig, index: number, isFeatured = false) => {
    const IconComponent = getIcon(gpt.icon)
    const isSelected = selectedGPT?.id === gpt.id

    return (
      <motion.div
        key={gpt.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card
          className={`h-full transition-all duration-200 cursor-pointer ${
            isFeatured
              ? "border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
              : "bg-white border border-gray-200"
          } ${isSelected ? "ring-2 ring-lda-red border-lda-red shadow-lg" : "hover:shadow-md hover:border-gray-300"}`}
          onClick={() => handleGPTSelect(gpt)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected
                      ? "bg-lda-red text-white"
                      : isFeatured
                        ? "bg-lda-red text-white"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <IconComponent size={isFeatured ? 20 : 16} />
                </div>
                <CardTitle className={isFeatured ? "text-lg" : "text-base"}>{gpt.name}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {isFeatured && <Badge className="bg-yellow-500 text-white">Featured</Badge>}
                {isSelected && (
                  <div className="p-1 bg-lda-red text-white rounded-full">
                    <Check size={12} />
                  </div>
                )}
              </div>
            </div>
            <CardDescription className={`text-gray-600 ${isFeatured ? "" : "text-sm line-clamp-2"}`}>
              {gpt.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1 mb-3">
              {gpt.tags.slice(0, isFeatured ? 3 : 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-gray-300">
                  {tag}
                </Badge>
              ))}
            </div>
            {isSelected && (
              <div className="text-xs text-lda-red font-medium flex items-center">
                <Check size={12} className="mr-1" />
                Selected for Chat
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6 pl-16 lg:pl-6">
            <div className="flex items-center space-x-2 lg:space-x-4">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">GPTs Dashboard</h1>
              <Badge variant="secondary" className="bg-lda-red text-white text-xs">
                {filteredGPTs.length} GPTs
              </Badge>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/admin/create-gpt">
                <Button className="bg-lda-red hover:bg-lda-red-dark text-white font-medium text-xs lg:text-sm px-3 lg:px-4">
                  <Plus size={16} className="lg:mr-2" />
                  <span className="hidden lg:inline">Create New GPT</span>
                </Button>
              </Link>
              <ThemeToggle />
              <Link href="/admin">
                <Button variant="outline" size="icon" className="border-gray-300 bg-transparent">
                  <Settings size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Selected GPT Bar */}
        {selectedGPT && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-lda-red text-white px-4 lg:px-6 py-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {(() => {
                    const IconComponent = getIcon(selectedGPT.icon)
                    return <IconComponent size={20} />
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm lg:text-base">{selectedGPT.name}</h3>
                  <p className="text-xs lg:text-sm opacity-90 line-clamp-1">{selectedGPT.description}</p>
                </div>
              </div>
              <Button
                onClick={handleStartChat}
                className="bg-white text-lda-red hover:bg-gray-100 font-medium text-sm w-full sm:w-auto"
              >
                Start Chat
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        <main className="p-4 lg:p-6">
          {/* Search and Filter */}
          <div className="mb-6 lg:mb-8">
            <div className="flex flex-col gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  placeholder="Search GPTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-lda-red focus:ring-lda-red"
                />
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                <TabsList className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-gray-200 w-full">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="data-[state=active]:bg-lda-red data-[state=active]:text-white text-xs lg:text-sm"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 lg:p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-xs lg:text-sm text-blue-800">
              <strong>How to use:</strong> Click on any GPT card below to select it as your active chatbot. The selected
              GPT will appear in the red bar above, and you can start chatting with it using the "Start Chat" button.
            </p>
          </motion.div>

          {/* Featured GPTs */}
          {gptsByCategory.featured.length > 0 && selectedCategory === "All" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 lg:mb-8"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Star className="text-yellow-500" size={20} />
                <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Featured GPTs</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {gptsByCategory.featured.map((gpt, index) => renderGPTCard(gpt, index, true))}
              </div>
            </motion.div>
          )}

          {/* All GPTs by Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {selectedCategory !== "All" ? (
              <div className="mb-6 lg:mb-8">
                <h3 className="text-base lg:text-lg font-medium text-gray-800 mb-4 border-l-4 border-lda-red pl-3">
                  {selectedCategory}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                  {filteredGPTs.map((gpt, index) => renderGPTCard(gpt, index, false))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-6">
                  <Bot className="text-lda-red" size={20} />
                  <h2 className="text-lg lg:text-xl font-semibold text-gray-900">All GPT Tools</h2>
                </div>

                {Object.entries(gptsByCategory).map(([categoryName, gpts]) => {
                  if (categoryName === "featured" || gpts.length === 0) return null

                  return (
                    <div key={categoryName} className="mb-6 lg:mb-8">
                      <h3 className="text-base lg:text-lg font-medium text-gray-800 mb-4 border-l-4 border-lda-red pl-3">
                        {categoryName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                        {gpts.map((gpt, index) => renderGPTCard(gpt, index, false))}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </motion.div>

          {/* No Results */}
          {filteredGPTs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Bot className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No GPTs Found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search terms or category filter.</p>
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("All")
                }}
                variant="outline"
                className="border-gray-300"
              >
                Clear Filters
              </Button>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
