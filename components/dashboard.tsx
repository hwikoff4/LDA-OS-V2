"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Settings,
  ArrowUpRight,
  Users,
  DollarSign,
  Target,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Search,
  X,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sidebar } from "@/components/dashboard-sidebar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type GPTConfig, getGPTConfigs } from "@/lib/gpt-configs"

type SearchResult = {
  id: string
  title: string
  description: string
  type: "gpt" | "action" | "module"
  href: string
  icon: any
}

export function Dashboard() {
  const router = useRouter()
  const [gptConfigs, setGptConfigs] = useState<GPTConfig[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, module: "Sales & Marketing", action: "VSL Generator used", time: "2 hours ago" },
    { id: 2, module: "EOS Tools", action: "L10 Meeting completed", time: "1 day ago" },
    { id: 3, module: "Finance", action: "Job costing calculated", time: "2 days ago" },
    { id: 4, module: "Team & Culture", action: "Core values updated", time: "3 days ago" },
  ])

  useEffect(() => {
    setGptConfigs(getGPTConfigs())
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      setSelectedIndex(0)
      return
    }

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    // Search GPTs
    gptConfigs.forEach((gpt) => {
      if (
        gpt.name.toLowerCase().includes(query) ||
        gpt.description.toLowerCase().includes(query) ||
        gpt.tags.some((tag) => tag.toLowerCase().includes(query))
      ) {
        results.push({
          id: gpt.id,
          title: gpt.name,
          description: gpt.description,
          type: "gpt",
          href: `/chat/${gpt.id}`,
          icon: MessageSquare,
        })
      }
    })

    // Search Quick Actions
    const quickActions = [
      {
        title: "Ask Legacy AI",
        description: "Get instant answers from our AI assistant",
        href: "/chat/legacy-ai",
        icon: MessageSquare,
        primary: true,
      },
      {
        title: "L10 Meeting Tracker",
        description: "Start or review your weekly L10 meetings",
        href: "/eos/l10-meetings",
        icon: Users,
      },
      {
        title: "Growth Roadmap",
        description: "Check your 30/60/90-day progress",
        href: "/growth-roadmap",
        icon: TrendingUp,
      },
      {
        title: "Team Member Access",
        description: "Manage team permissions and access",
        href: "/team-access",
        icon: Users,
      },
    ]

    quickActions.forEach((action) => {
      if (action.title.toLowerCase().includes(query) || action.description.toLowerCase().includes(query)) {
        results.push({
          id: action.title,
          title: action.title,
          description: action.description,
          type: "action",
          href: action.href,
          icon: action.icon,
        })
      }
    })

    // Search Modules
    const moduleOverview = [
      { name: "EOS Tools", usage: "8 tools used", icon: Target, color: "bg-blue-50 text-blue-600" },
      { name: "Sales & Marketing", usage: "5 GPTs active", icon: TrendingUp, color: "bg-green-50 text-green-600" },
      { name: "Finance", usage: "4 calculators", icon: DollarSign, color: "bg-yellow-50 text-yellow-600" },
      { name: "Operations", usage: "3 processes", icon: Briefcase, color: "bg-purple-50 text-purple-600" },
      { name: "Learning", usage: "2 courses", icon: GraduationCap, color: "bg-indigo-50 text-indigo-600" },
      { name: "Team & Culture", usage: "4 builders", icon: Users, color: "bg-pink-50 text-pink-600" },
    ]

    moduleOverview.forEach((module) => {
      if (module.name.toLowerCase().includes(query)) {
        results.push({
          id: module.name,
          title: module.name,
          description: module.usage,
          type: "module",
          href: "/gpts-dashboard", // Navigate to GPTs dashboard
          icon: module.icon,
        })
      }
    })

    setSearchResults(results.slice(0, 8)) // Limit to 8 results
    setShowResults(results.length > 0)
    setSelectedIndex(0)
  }, [searchQuery, gptConfigs])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % searchResults.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (searchResults[selectedIndex]) {
        router.push(searchResults[selectedIndex].href)
        setSearchQuery("")
        setShowResults(false)
      }
    } else if (e.key === "Escape") {
      setShowResults(false)
    }
  }

  const handleResultClick = (href: string) => {
    router.push(href)
    setSearchQuery("")
    setShowResults(false)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "gpt":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
      case "action":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
      case "module":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Client Dashboard KPIs (Company View)
  const clientKPIs = [
    {
      title: "Monthly Revenue",
      value: "$45,200",
      subtitle: "This month",
      icon: DollarSign,
      trend: "↑ 18% from last month",
      trendUp: true,
    },
    {
      title: "Projects in Progress",
      value: "12",
      subtitle: "Active projects",
      icon: Briefcase,
      trend: "3 completed this week",
      trendUp: true,
    },
    {
      title: "Active Client Count",
      value: "28",
      subtitle: "Current clients",
      icon: Users,
      trend: "↑ 4 new this month",
      trendUp: true,
    },
    {
      title: "Lead Pipeline",
      value: "15",
      subtitle: "Qualified leads",
      icon: Target,
      trend: "↑ 25% conversion rate",
      trendUp: true,
    },
  ]

  const quickActions = [
    {
      title: "Ask Legacy AI",
      description: "Get instant answers from our AI assistant",
      href: "/chat/legacy-ai",
      icon: MessageSquare,
      primary: true,
    },
    {
      title: "L10 Meeting Tracker",
      description: "Start or review your weekly L10 meetings",
      href: "/eos/l10-meetings",
      icon: Users,
    },
    {
      title: "Growth Roadmap",
      description: "Check your 30/60/90-day progress",
      href: "/growth-roadmap",
      icon: TrendingUp,
    },
    {
      title: "Team Member Access",
      description: "Manage team permissions and access",
      href: "/team-access",
      icon: Users,
    },
  ]

  const moduleOverview = [
    { name: "EOS Tools", usage: "8 tools used", icon: Target, color: "bg-blue-50 text-blue-600" },
    { name: "Sales & Marketing", usage: "5 GPTs active", icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { name: "Finance", usage: "4 calculators", icon: DollarSign, color: "bg-yellow-50 text-yellow-600" },
    { name: "Operations", usage: "3 processes", icon: Briefcase, color: "bg-purple-50 text-purple-600" },
    { name: "Learning", usage: "2 courses", icon: GraduationCap, color: "bg-indigo-50 text-indigo-600" },
    { name: "Team & Culture", usage: "4 builders", icon: Users, color: "bg-pink-50 text-pink-600" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6 pl-16 lg:pl-6">
            <div className="flex items-center space-x-4 relative flex-1" ref={searchRef}>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => searchQuery && setShowResults(true)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-lda-red focus:border-transparent text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("")
                      setShowResults(false)
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                    >
                      {searchResults.map((result, index) => (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result.href)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                            index === selectedIndex ? "bg-gray-50" : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-1">
                              <result.icon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-gray-900 truncate">{result.title}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge(result.type)}`}>
                                  {result.type.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-1">{result.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-3">
              <ThemeToggle />
              <Link href="/admin">
                <Button variant="outline" size="icon" className="border-gray-300 bg-transparent">
                  <Settings size={20} />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {/* Welcome Section */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Welcome to Legacy Decks Academy</h1>
            <p className="text-sm lg:text-base text-gray-600">
              Your complete business operating system - manage, grow, and optimize your company
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
            {clientKPIs.map((kpi, index) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <kpi.icon className="h-5 w-5 text-lda-red" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                          <p className="text-xs text-gray-500">{kpi.subtitle}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
                      <div className={`text-sm ${kpi.trendUp ? "text-green-600" : "text-red-600"}`}>{kpi.trend}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Growth Roadmap Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-6 lg:mb-8"
          >
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-lda-red" />
                  <CardTitle className="text-base lg:text-lg font-semibold text-gray-900">
                    Growth Roadmap Progress
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Track your 30/60/90-day milestones and coach check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-lda-red mb-2">85%</div>
                    <div className="text-sm font-medium text-gray-900">30-Day Goals</div>
                    <div className="text-xs text-gray-600">8 of 10 completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 mb-2">60%</div>
                    <div className="text-sm font-medium text-gray-900">60-Day Goals</div>
                    <div className="text-xs text-gray-600">6 of 10 completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-400 mb-2">25%</div>
                    <div className="text-sm font-medium text-gray-900">90-Day Goals</div>
                    <div className="text-xs text-gray-600">2 of 8 completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column: Quick Actions + Recent Activity */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 text-xs lg:text-sm"
                      >
                        View All Tools
                        <ArrowUpRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {quickActions.map((action) => (
                      <Link key={action.title} href={action.href}>
                        <Button
                          variant={action.primary ? "default" : "outline"}
                          className={`w-full justify-start h-auto p-4 ${
                            action.primary
                              ? "bg-lda-red hover:bg-lda-red-dark text-white"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start space-x-3 w-full">
                            <action.icon
                              size={20}
                              className={`flex-shrink-0 mt-0.5 ${action.primary ? "text-white" : "text-gray-600"}`}
                            />
                            <div className="text-left flex-1 min-w-0">
                              <div className="font-medium whitespace-normal break-words">{action.title}</div>
                              <div
                                className={`text-sm whitespace-normal break-words ${action.primary ? "opacity-90" : "text-gray-600"}`}
                              >
                                {action.description}
                              </div>
                            </div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base lg:text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      Your latest tool usage and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-64 overflow-y-auto space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 bg-lda-red rounded-full" />
                          <div>
                            <p className="font-medium text-gray-900">{activity.module}</p>
                            <p className="text-sm text-gray-600">{activity.action}</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column: Module Overview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base lg:text-lg font-semibold text-gray-900">Module Overview</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Your business tools at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {moduleOverview.map((module) => (
                    <div key={module.name} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${module.color}`}>
                          <module.icon size={16} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{module.name}</p>
                          <p className="text-sm text-gray-600">{module.usage}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={16} className="text-gray-400" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
