"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronRight,
  Bot,
  Users,
  Briefcase,
  TrendingUp,
  FileText,
  HelpCircle,
  LogOut,
  Target,
  Calendar,
  CheckSquare,
  BarChart3,
  GraduationCap,
  MessageCircle,
  FileQuestion,
  UserCheck,
  Menu,
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface SidebarSection {
  title: string
  items: {
    title: string
    href: string
    icon: any
    badge?: string
    description?: string
  }[]
  isMainModule?: boolean
  hasDropdown?: boolean
}

export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(["Main Modules"])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  const sections: SidebarSection[] = [
    {
      title: "Main Modules",
      isMainModule: true,
      items: [
        { title: "Dashboard", href: "/", icon: LayoutDashboard },
        { title: "Ask Legacy AI", href: "/chat/legacy-ai", icon: MessageSquare, badge: "AI" },
        { title: "Learning & Community", href: "/learning/courses", icon: GraduationCap },
      ],
    },
    {
      title: "Business Management",
      hasDropdown: true,
      items: [
        { title: "Projects", href: "/projects", icon: Briefcase },
        { title: "Calendar", href: "/calendar", icon: Calendar },
        { title: "Documents", href: "/documents", icon: FileText, description: "SOPs, contracts, templates" },
        { title: "Growth Roadmap", href: "/growth-roadmap", icon: TrendingUp },
      ],
    },
    {
      title: "EOS Tools",
      items: [
        { title: "Scorecards", href: "/eos/scorecards", icon: BarChart3 },
        { title: "Rocks", href: "/eos/rocks", icon: Target },
        { title: "To-Dos", href: "/eos/todos", icon: CheckSquare },
        { title: "Issues List", href: "/eos/issues", icon: FileQuestion },
        { title: "L10 Meeting Tracker", href: "/eos/l10-meetings", icon: Users },
        { title: "Other Meeting Logs", href: "/eos/meeting-logs", icon: MessageCircle },
        { title: "Accountability Chart", href: "/eos/accountability", icon: UserCheck },
        { title: "Vision & Goals", href: "/eos/vision-goals", icon: Target },
      ],
    },
    {
      title: "GPTs Dashboard",
      items: [
        { title: "All GPTs", href: "/gpts-dashboard", icon: Bot, badge: "AI" },
        { title: "Core business", href: "/gpts-dashboard?category=Core", icon: Briefcase },
        { title: "Operations and Team", href: "/gpts-dashboard?category=Operations", icon: Users },
        { title: "Marketing and Client Experience", href: "/gpts-dashboard?category=Marketing", icon: TrendingUp },
      ],
    },
  ]

  return (
    <>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-md"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} className="text-gray-900" /> : <Menu size={24} className="text-gray-900" />}
      </button>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "w-80 bg-white border-r border-gray-200 flex flex-col h-full",
          "fixed lg:relative z-40 transition-transform duration-300",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image src="/logo.png" alt="Legacy Decks Academy" width={40} height={40} className="rounded" />
            <div>
              <h2 className="font-bold text-gray-900">Legacy Decks Academy</h2>
              <p className="text-sm text-gray-500">Operating System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-0 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title}>
              {section.isMainModule ? (
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.title} href={item.href} onClick={handleLinkClick}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start text-gray-600 hover:text-lda-red hover:bg-red-50 font-normal",
                          "data-[state=active]:text-lda-red data-[state=active]:bg-red-50 data-[state=active]:border-r-2 data-[state=active]:border-lda-red",
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.title}
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto text-xs bg-lda-red text-white">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start font-medium text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                    onClick={() => toggleSection(section.title)}
                  >
                    {expandedSections.includes(section.title) ? (
                      <ChevronDown className="mr-2 h-4 w-4" />
                    ) : (
                      <ChevronRight className="mr-2 h-4 w-4" />
                    )}
                    {section.title}
                  </Button>
                  {expandedSections.includes(section.title) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {section.items.map((item) => (
                        <Link key={item.title} href={item.href} onClick={handleLinkClick}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-gray-600 hover:text-lda-red hover:bg-red-50 font-normal text-left"
                            title={item.description}
                          >
                            <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs bg-lda-red text-white">
                                {item.badge}
                              </Badge>
                            )}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <Link href="/settings" onClick={handleLinkClick}>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900 font-normal">
              <Settings className="mr-3 h-5 w-5" />
              Settings & Account
            </Button>
          </Link>
          <Link href="/help" onClick={handleLinkClick}>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900 font-normal">
              <HelpCircle className="mr-3 h-5 w-5" />
              Help & Support
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-900 font-normal">
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </>
  )
}
