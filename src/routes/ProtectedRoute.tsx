import type { PropsWithChildren } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuth } from "@/auth/useAuth"
import { Spinner } from "@/components/ui/spinner"

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { authLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    return <>{children}</>
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-5" />
        <span>Cargando sesion...</span>
      </div>
    )
  }

  return <Navigate to="/login" replace state={{ from: location }} />
}
