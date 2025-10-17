"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: "owner" | "admin" | "company_owner" | "employee"
  company_id: string | null
  status: "active" | "inactive" | "suspended"
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  user_id: string
  permission_key: string
  granted_by: string | null
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  permissions: string[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasRole: (...roles: UserProfile["role"][]) => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()

    if (profileData) {
      setProfile(profileData as UserProfile)

      const { data: permsData } = await supabase
        .from("user_permissions")
        .select("permission_key")
        .eq("user_id", userId)

      const permKeys = permsData?.map((p) => p.permission_key) || []
      setPermissions(permKeys)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setUser(session.user)
        await fetchProfile(session.user.id)
      }

      setLoading(false)
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setPermissions([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false
    if (profile.role === "owner") return true
    if (profile.role === "admin") {
      if (permission.includes("owner")) return false
      return true
    }
    return permissions.includes(permission)
  }

  const hasRole = (...roles: UserProfile["role"][]): boolean => {
    if (!profile) return false
    return roles.includes(profile.role)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        permissions,
        loading,
        signIn,
        signUp,
        signOut,
        hasPermission,
        hasRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
