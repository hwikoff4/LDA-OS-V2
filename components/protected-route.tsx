"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredRoles?: ("owner" | "admin" | "company_owner" | "employee")[]
}

export function ProtectedRoute({ children, requiredPermission, requiredRoles }: ProtectedRouteProps) {
  const { user, profile, hasPermission, hasRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/")
        return
      }

      if (requiredRoles && requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
        router.push("/")
        return
      }
    }
  }, [user, profile, loading, requiredPermission, requiredRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
    return null
  }

  return <>{children}</>
}
