import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react"

import {
  getAccessToken,
  invalidateAuthSession,
  registerAuthFailureHandler,
  setAccessToken as setApiAccessToken,
} from "@/api/client"
import {
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  refreshAccessTokenRequest,
  updateCurrentUserRequest,
} from "@/api/authApi"
import type { AuthCredentials, AuthProfileUpdatePayload, AuthUser } from "@/pages/types"

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  authLoading: boolean
  isAuthenticated: boolean
  login: (credentials: AuthCredentials) => Promise<AuthUser>
  logout: () => Promise<void>
  updateProfile: (payload: AuthProfileUpdatePayload) => Promise<AuthUser>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken())
  const [authLoading, setAuthLoading] = useState(true)

  const applyAccessToken = useCallback((nextAccessToken: string | null) => {
    setApiAccessToken(nextAccessToken)
    setAccessTokenState(nextAccessToken)
  }, [])

  const clearAuthState = useCallback(() => {
    invalidateAuthSession()
    applyAccessToken(null)
    setUser(null)
  }, [applyAccessToken])

  const hydrateAuthenticatedUser = useCallback(async (nextAccessToken: string) => {
    applyAccessToken(nextAccessToken)
    const currentUser = await getCurrentUserRequest()
    setUser(currentUser)
    return currentUser
  }, [applyAccessToken])

  const login = useCallback(async (credentials: AuthCredentials) => {
    const { access } = await loginRequest(credentials)

    try {
      return await hydrateAuthenticatedUser(access)
    } catch (error) {
      clearAuthState()
      throw error
    }
  }, [clearAuthState, hydrateAuthenticatedUser])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearAuthState()
    }
  }, [clearAuthState])

  const updateProfile = useCallback(async (payload: AuthProfileUpdatePayload) => {
    const updatedUser = await updateCurrentUserRequest(payload)
    setUser(updatedUser)
    return updatedUser
  }, [])

  useEffect(() => {
    registerAuthFailureHandler(() => {
      clearAuthState()
      setAuthLoading(false)
    })

    return () => {
      registerAuthFailureHandler(null)
    }
  }, [clearAuthState])

  useEffect(() => {
    let active = true

    async function initializeAuth() {
      setAuthLoading(true)

      try {
        const { access } = await refreshAccessTokenRequest()

        if (!active) {
          return
        }

        await hydrateAuthenticatedUser(access)
      } catch {
        if (!active) {
          return
        }

        clearAuthState()
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    void initializeAuth()

    return () => {
      active = false
    }
  }, [clearAuthState, hydrateAuthenticatedUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        authLoading,
        isAuthenticated: Boolean(accessToken),
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
