import axios from "axios"

import { api } from "@/api/client"
import type { AuthCredentials, AuthProfileUpdatePayload, AuthUser } from "@/pages/types"

type JwtTokenPair = {
  access: string
}

type AccessTokenResponse = {
  access: string
}

function buildApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data === "string" && data.trim().length > 0) {
      return data
    }

    if (data) {
      return JSON.stringify(data)
    }
  }

  return fallback
}

export async function loginRequest(credentials: AuthCredentials) {
  try {
    const { data } = await api.post<JwtTokenPair>(
      "/auth/jwt/create/",
      credentials,
      { skipAuthRefresh: true, requiresCsrf: true }
    )
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo iniciar sesión"))
  }
}

export async function refreshAccessTokenRequest() {
  try {
    const { data } = await api.post<AccessTokenResponse>("/auth/jwt/refresh/", undefined, {
      skipAuthRefresh: true,
      requiresCsrf: true,
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo restaurar la sesión"))
  }
}

export async function logoutRequest() {
  try {
    await api.post("/auth/jwt/logout/", undefined, { skipAuthRefresh: true, requiresCsrf: true })
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo cerrar sesión"))
  }
}

export async function getCurrentUserRequest() {
  try {
    const { data } = await api.get<AuthUser>("/auth/users/me/")
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo cargar el usuario"))
  }
}

export async function updateCurrentUserRequest(payload: AuthProfileUpdatePayload) {
  try {
    const { data } = await api.patch<AuthUser>("/auth/users/me/", payload)
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron actualizar los datos"))
  }
}

