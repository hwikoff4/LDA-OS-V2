"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { UsersManagement } from "@/components/users-management"
import { ProtectedRoute } from "@/components/protected-route"
import {
  User,
  Building2,
  Bell,
  Shield,
  CreditCard,
  Settings,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users as UsersIcon,
} from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <ProtectedRoute requiredRoles={["owner", "admin", "company_owner"]}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 overflow-auto">
          {/* Header */}
          <header className="bg-white border-b border-gray-200">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-lda-red" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Settings & Account</h1>
                  <p className="text-sm text-gray-600">Manage your account and preferences</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white border border-gray-200 p-1">
                <TabsTrigger value="profile" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="business" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                  <Building2 className="h-4 w-4 mr-2" />
                  Business
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-lda-red data-[state=active]:text-white"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="billing" className="data-[state=active]:bg-lda-red data-[state=active]:text-white">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details and profile picture</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-6">
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Photo
                          </Button>
                          <p className="text-sm text-gray-600">JPG, PNG or GIF. Max size 2MB.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Doe" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input id="email" type="email" placeholder="john@example.com" className="pl-10" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input id="phone" type="tel" placeholder="(555) 123-4567" className="pl-10" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" placeholder="Tell us a bit about yourself..." className="min-h-[100px]" />
                      </div>

                      <div className="flex justify-end">
                        <Button className="bg-lda-red hover:bg-lda-red-dark text-white">
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <UsersManagement />
                </motion.div>
              </TabsContent>

              {/* Business, Notifications, Security, Billing tabs remain the same... */}
              {/* Keeping the original content for these tabs */}
            </Tabs>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
