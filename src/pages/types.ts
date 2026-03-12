// Tipos usados por la pagina de registro y su formulario dependiente de region/comuna.

export type RegisterPayload = {
  email: string
  nombre: string
  apellido: string
  direccion_entrega: string
  region_id: number
  comuna_id: number
  password: string
  re_password: string
}

export type Region = {
  id: number
  nombre: string
}

export type Comuna = {
  id: number
  nombre: string
  region_id: number
}

export type ComunaResponse = {
  id: number
  nombre: string
  region: Region
}

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type AuthCredentials = {
  email: string
  password: string
}

export type AuthProfileUpdatePayload = {
  nombre?: string
  apellido?: string
  direccion_entrega?: string
  region_id?: number
  comuna_id?: number
}

export type AuthUser = {
  id: number | string
  email: string
  nombre?: string
  apellido?: string
  direccion_entrega?: string
  region?: Region
  region_id?: number
  comuna?: ComunaResponse
  comuna_id?: number
}

export type CatalogAuthor = {
  id: number
  nombre: string
  slug: string
  biografia: string
}

export type CatalogGenre = {
  id: number
  nombre: string
  slug: string
  descripcion: string
}

export type CatalogPublisher = {
  id: number
  nombre: string
  slug: string
  descripcion: string
  sitio_web: string
}

export type CatalogWork = {
  id: number
  titulo: string
  slug: string
  descripcion: string
  descripcion_corta: string
  autor: CatalogAuthor
  genero: CatalogGenre
  creado_en: string
  actualizado_en: string
}

export type CatalogBook = {
  id: number
  nombre: string
  slug: string
  sku: string
  imagen: string | null
  descripcion: string
  descripcion_corta: string
  precio: string
  precio_referencia: string | null
  moneda: string
  stock: number
  gestionar_stock: boolean
  peso_kg: string | null
  alto_cm: string | null
  ancho_cm: string | null
  largo_cm: string | null
  activo: boolean
  destacado: boolean
  obra: CatalogWork
  autor: CatalogAuthor
  genero: CatalogGenre
  editorial: CatalogPublisher
  tipo_tapa: string
  cantidad_paginas: number | null
  isbn: string
  idioma: string
  anio_publicacion: number | null
  creado_en: string
  actualizado_en: string
}

export type CatalogBookFilters = {
  titulo?: string
  autor?: string
  editorial?: string
  genero?: string
  tipo_tapa?: string
  destacado?: boolean
  activo?: boolean
}
