import { useEffect, useState } from "react"
import { ArrowLeft, BookOpenText } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import { Skeleton } from "@/components/ui/skeleton"
import { getCatalogBookById, resolveMediaUrl } from "@/lib/api"
import type { CatalogBook } from "@/pages/types"

function formatCurrency(value: string, currency: string) {
  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return `${currency} ${value}`
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
      <div className="space-y-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-1/2" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export function BookDetailPage() {
  const { bookId } = useParams()
  const [book, setBook] = useState<CatalogBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadBook() {
      if (!bookId) {
        setError("Libro no encontrado")
        setIsLoading(false)
        return
      }

      try {
        const nextBook = await getCatalogBookById(bookId)

        if (ignore) {
          return
        }

        setBook(nextBook)
        setError(null)
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el libro")
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void loadBook()

    return () => {
      ignore = true
    }
  }, [bookId])

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (!book) {
    return (
      <section className="space-y-6">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catalogo
        </Link>
        <div className="rounded-[2rem] border border-destructive/20 bg-destructive/8 px-6 py-8 text-sm text-destructive">
          {error ?? "No se pudo encontrar el libro."}
        </div>
      </section>
    )
  }

  const imageSrc = resolveMediaUrl(book.imagen)
  const description = book.descripcion || book.obra.descripcion || "Sin descripcion disponible."

  return (
    <section className="space-y-8">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catalogo
      </Link>

      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm">
          {imageSrc ? (
            <img src={imageSrc} alt={book.nombre} className="aspect-[4/5] h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/5] items-center justify-center bg-muted text-muted-foreground">
              <BookOpenText className="h-14 w-14" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold tracking-[0.24em] uppercase text-muted-foreground">
              {book.editorial.nombre}
            </p>
            <h1 className="text-4xl font-semibold leading-tight">{book.nombre}</h1>
            <p className="text-lg text-muted-foreground">{book.autor.nombre}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] bg-card px-4 py-4 shadow-sm ring-1 ring-border/70">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Precio
              </p>
              <p className="mt-2 text-2xl font-semibold">
                {formatCurrency(book.precio, book.moneda)}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-card px-4 py-4 shadow-sm ring-1 ring-border/70">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Tapa
              </p>
              <p className="mt-2 text-lg font-semibold">{book.tipo_tapa || "N/D"}</p>
            </div>
            <div className="rounded-[1.5rem] bg-card px-4 py-4 shadow-sm ring-1 ring-border/70">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Paginas
              </p>
              <p className="mt-2 text-lg font-semibold">{book.cantidad_paginas ?? "N/D"}</p>
            </div>
            <div className="rounded-[1.5rem] bg-card px-4 py-4 shadow-sm ring-1 ring-border/70">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                Ano
              </p>
              <p className="mt-2 text-lg font-semibold">{book.anio_publicacion ?? "N/D"}</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-muted/55 px-4 py-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">Genero</p>
              <p className="mt-2 text-base font-semibold text-foreground">{book.genero.nombre}</p>
            </div>
            <div className="rounded-[1.5rem] bg-muted/55 px-4 py-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">ISBN</p>
              <p className="mt-2 text-base font-semibold text-foreground">{book.isbn || "N/D"}</p>
            </div>
            <div className="rounded-[1.5rem] bg-muted/55 px-4 py-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">Idioma</p>
              <p className="mt-2 text-base font-semibold text-foreground">{book.idioma || "N/D"}</p>
            </div>
            <div className="rounded-[1.5rem] bg-muted/55 px-4 py-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase">Stock</p>
              <p className="mt-2 text-base font-semibold text-foreground">{book.stock}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Sobre este libro</h2>
            <p className="text-sm leading-7 text-muted-foreground">{description}</p>
            {book.obra.descripcion_corta ? (
              <p className="text-sm leading-7 text-muted-foreground">{book.obra.descripcion_corta}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
