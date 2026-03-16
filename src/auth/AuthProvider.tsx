import {
  createContext,
  useCallback,
  useEffect,
  useRef,
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
  restoreSession: () => Promise<boolean>
  login: (credentials: AuthCredentials) => Promise<AuthUser>
  logout: () => Promise<void>
  updateProfile: (payload: AuthProfileUpdatePayload) => Promise<AuthUser>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken())
  const [authLoading, setAuthLoading] = useState(false)
  const restorePromiseRef = useRef<Promise<boolean> | null>(null)

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

  const restoreSession = useCallback(async () => {
    if (restorePromiseRef.current) {
      return restorePromiseRef.current
    }

    let currentRestorePromise: Promise<boolean> | null = null
    currentRestorePromise = (async () => {
      setAuthLoading(true)

      try {
        const { access } = await refreshAccessTokenRequest()
        await hydrateAuthenticatedUser(access)
        return true
      } catch {
        clearAuthState()
        return false
      } finally {
        setAuthLoading(false)
        if (restorePromiseRef.current === currentRestorePromise) {
          restorePromiseRef.current = null
        }
      }
    })()

    restorePromiseRef.current = currentRestorePromise
    return currentRestorePromise
  }, [clearAuthState, hydrateAuthenticatedUser])

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
    if (accessToken && !user) {
      setAuthLoading(true)
      void getCurrentUserRequest()
        .then((currentUser) => {
          setUser(currentUser)
        })
        .catch(() => {
          clearAuthState()
        })
        .finally(() => {
          setAuthLoading(false)
        })
    }
  }, [accessToken, clearAuthState, user])

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        authLoading,
        isAuthenticated: Boolean(accessToken),
        restoreSession,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
