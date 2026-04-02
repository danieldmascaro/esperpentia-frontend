import axios from "axios"
import { api } from "@/api/client"
import { queryCache } from "@/lib/query-cache"
import type {
  CatalogAuthor,
  CatalogBook,
  CatalogBookFilters,
  CatalogGenre,
  CatalogPublisher,
  Comuna,
  ComunaResponse,
  PaginatedResponse,
  RegisterPayload,
  Region,
} from "@/pages/types"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""

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

function normalizePaginatedData<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

function buildQueryParams(filters: CatalogBookFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  )
}

export function resolveMediaUrl(path: string | null) {
  if (!path) {
    return null
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export async function registerUser(payload: RegisterPayload) {
  try {
    const { data } = await api.post("/auth/users/", payload, { skipAuthRefresh: true })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "Error creando usuario"))
  }
}

export async function activateUser(uid: string, token: string) {
  try {
    const { data } = await api.post("/auth/users/activation/", { uid, token }, { skipAuthRefresh: true })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo activar la cuenta"))
  }
}

export async function getRegions() {
  try {
    const { data } = await api.get<Region[]>("/users/regiones/")
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron cargar las regiones"))
  }
}

export async function getComunas(regionId: number) {
  try {
    const { data } = await api.get<ComunaResponse[]>("/users/comunas/", {
      params: { region_id: regionId },
    })
    return data.map((comuna): Comuna => ({
      id: comuna.id,
      nombre: comuna.nombre,
      region_id: comuna.region.id,
      county_code: comuna.county_code,
    }))
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron cargar las comunas"))
  }
}

export async function getCatalogBooks(filters: CatalogBookFilters) {
  // Generar clave de caché basada en filtros
  const cacheKey = `books:${JSON.stringify(filters)}`

  return queryCache.getOrFetch(cacheKey, async () => {
    try {
      const { data } = await api.get<PaginatedResponse<CatalogBook> | CatalogBook[]>(
        "/catalog/books/",
        {
          params: buildQueryParams(filters),
        }
      )

      return normalizePaginatedData(data)
    } catch (error) {
      throw new Error(buildApiErrorMessage(error, "No se pudo cargar el catalogo"))
    }
  })
}

export async function getCatalogBookById(bookId: number | string) {
  const cacheKey = `book:${bookId}`

  return queryCache.getOrFetch(cacheKey, async () => {
    try {
      const { data } = await api.get<CatalogBook>(`/catalog/books/${bookId}/`)
      return data
    } catch (error) {
      throw new Error(buildApiErrorMessage(error, "No se pudo cargar el libro"))
    }
  })
}

export async function getCatalogAuthors() {
  const cacheKey = "authors:all"

  return queryCache.getOrFetch(cacheKey, async () => {
    try {
      const { data } = await api.get<PaginatedResponse<CatalogAuthor> | CatalogAuthor[]>(
        "/catalog/authors/"
      )
      return normalizePaginatedData(data)
    } catch (error) {
      throw new Error(buildApiErrorMessage(error, "No se pudieron cargar los autores"))
    }
  })
}

export async function getCatalogGenres() {
  const cacheKey = "genres:all"

  return queryCache.getOrFetch(cacheKey, async () => {
    try {
      const { data } = await api.get<PaginatedResponse<CatalogGenre> | CatalogGenre[]>(
        "/catalog/genres/"
      )
      return normalizePaginatedData(data)
    } catch (error) {
      throw new Error(buildApiErrorMessage(error, "No se pudieron cargar los generos"))
    }
  })
}

export async function getCatalogPublishers() {
  const cacheKey = "publishers:all"

  return queryCache.getOrFetch(cacheKey, async () => {
    try {
      const { data } = await api.get<PaginatedResponse<CatalogPublisher> | CatalogPublisher[]>(
        "/catalog/publishers/"
      )
      return normalizePaginatedData(data)
    } catch (error) {
      throw new Error(buildApiErrorMessage(error, "No se pudieron cargar las editoriales"))
    }
  })
}
