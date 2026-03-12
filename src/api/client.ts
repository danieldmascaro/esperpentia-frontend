import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from "axios"

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean
    skipAuthRefresh?: boolean
  }

  export interface InternalAxiosRequestConfig {
    _retry?: boolean
    skipAuthRefresh?: boolean
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null
let onAuthFailure: (() => void) | null = null
let authSessionVersion = 0

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

function setAuthorizationHeader(config: RetryableRequestConfig, token: string) {
  const headers = AxiosHeaders.from(config.headers)
  headers.set("Authorization", `Bearer ${token}`)
  config.headers = headers
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  const sessionVersionAtStart = authSessionVersion
  const currentRefreshPromise = api
    .post<{ access: string }>("/auth/jwt/refresh/", undefined, {
      skipAuthRefresh: true,
    } as RetryableRequestConfig)
    .then(({ data }) => {
      if (sessionVersionAtStart !== authSessionVersion) {
        return null
      }

      setAccessToken(data.access)
      return data.access
    })
    .catch(() => {
      clearAccessToken()
      onAuthFailure?.()
      return null
    })
    .finally(() => {
      if (refreshPromise === currentRefreshPromise) {
        refreshPromise = null
      }
    })

  refreshPromise = currentRefreshPromise
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const requestConfig = config as RetryableRequestConfig

  if (
    accessToken &&
    !requestConfig.skipAuthRefresh &&
    !requestConfig.url?.includes("/auth/jwt/refresh/")
  ) {
    setAuthorizationHeader(requestConfig, accessToken)
  }

  return requestConfig
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (!originalRequest || status !== 401) {
      return Promise.reject(error)
    }

    if (
      originalRequest.skipAuthRefresh ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/jwt/refresh/")
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const nextAccessToken = await refreshAccessToken()

    if (!nextAccessToken) {
      return Promise.reject(error)
    }

    setAuthorizationHeader(originalRequest, nextAccessToken)
    return api(originalRequest)
  }
)

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export function invalidateAuthSession() {
  authSessionVersion += 1
  clearAccessToken()
}

export function registerAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler
}
