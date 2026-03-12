import { useDeferredValue, useEffect, useState, startTransition } from "react"
import { Filter, Search } from "lucide-react"

import { BookCard, BookCardSkeleton } from "@/components/BookCard"
import {
  getCatalogAuthors,
  getCatalogBooks,
  getCatalogGenres,
  getCatalogPublishers,
} from "@/lib/api"
import type {
  CatalogAuthor,
  CatalogBook,
  CatalogBookFilters,
  CatalogGenre,
  CatalogPublisher,
} from "@/pages/types"

type FilterState = {
  titulo: string
  autor: string
  editorial: string
  genero: string
  tipo_tapa: string
  destacado: "all" | "featured" | "regular"
}

const defaultFilters: FilterState = {
  titulo: "",
  autor: "",
  editorial: "",
  genero: "",
  tipo_tapa: "",
  destacado: "all",
}

const coverOptions = [
  { value: "", label: "Todas las tapas" },
  { value: "DURA", label: "Tapa dura" },
  { value: "BLANDA", label: "Tapa blanda" },
]

function buildBookFilters(filters: FilterState): CatalogBookFilters {
  return {
    activo: true,
    titulo: filters.titulo.trim() || undefined,
    autor: filters.autor || undefined,
    editorial: filters.editorial || undefined,
    genero: filters.genero || undefined,
    tipo_tapa: filters.tipo_tapa || undefined,
    destacado:
      filters.destacado === "featured" ? true : filters.destacado === "regular" ? false : undefined,
  }
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-border bg-card/70 px-6 py-16 text-center">
      <p className="text-sm font-semibold tracking-[0.28em] uppercase text-muted-foreground">
        Sin resultados
      </p>
      <h3 className="mt-3 text-2xl font-semibold">No encontramos libros para esos filtros</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Ajusta la busqueda, cambia el genero o limpia los filtros para volver a explorar.
      </p>
    </div>
  )
}

export function CatalogPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const deferredTitle = useDeferredValue(filters.titulo)
  const [books, setBooks] = useState<CatalogBook[]>([])
  const [authors, setAuthors] = useState<CatalogAuthor[]>([])
  const [genres, setGenres] = useState<CatalogGenre[]>([])
  const [publishers, setPublishers] = useState<CatalogPublisher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadFilterOptions() {
      try {
        const [authorsData, genresData, publishersData] = await Promise.all([
          getCatalogAuthors(),
          getCatalogGenres(),
          getCatalogPublishers(),
        ])

        if (ignore) {
          return
        }

        setAuthors(authorsData)
        setGenres(genresData)
        setPublishers(publishersData)
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los filtros")
        }
      }
    }

    void loadFilterOptions()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const firstLoad = books.length === 0
    const nextFilters = buildBookFilters({ ...filters, titulo: deferredTitle })

    setError(null)
    if (firstLoad) {
      setIsLoading(true)
    } else {
      setIsFilterLoading(true)
    }

    async function loadBooks() {
      try {
        const nextBooks = await getCatalogBooks(nextFilters)

        if (ignore) {
          return
        }

        setBooks(nextBooks)
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el catalogo")
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
          setIsFilterLoading(false)
        }
      }
    }

    void loadBooks()

    return () => {
      ignore = true
    }
  }, [
    books.length,
    deferredTitle,
    filters.autor,
    filters.destacado,
    filters.editorial,
    filters.genero,
    filters.tipo_tapa,
  ])

  const totalBooksLabel = `${books.length} ${books.length === 1 ? "libro" : "libros"}`

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    startTransition(() => {
      setFilters((current) => ({ ...current, [key]: value }))
    })
  }

  function resetFilters() {
    startTransition(() => {
      setFilters(defaultFilters)
    })
  }

  return (
    <section className="grid gap-8 xl:grid-cols-[18rem_minmax(0,1fr)] xl:items-start">
      <aside className="space-y-4 xl:sticky xl:top-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <label className="group flex h-11 min-w-0 items-center gap-3 border-b border-border/80 px-1 transition-colors focus-within:border-black sm:col-span-2 xl:col-span-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={filters.titulo}
              onChange={(event) => updateFilter("titulo", event.target.value)}
              placeholder="Buscar por titulo"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          <label className="flex h-11 min-w-0 items-center border-b border-border/80 px-1 transition-colors focus-within:border-black">
            <input
              type="text"
              list="catalog-authors"
              value={filters.autor}
              onChange={(event) => updateFilter("autor", event.target.value)}
              placeholder="Autor"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <datalist id="catalog-authors">
            {authors.map((author) => (
              <option key={author.id} value={author.nombre} />
            ))}
          </datalist>

          <label className="flex h-11 min-w-0 items-center border-b border-border/80 px-1 transition-colors focus-within:border-black">
            <input
              type="text"
              list="catalog-genres"
              value={filters.genero}
              onChange={(event) => updateFilter("genero", event.target.value)}
              placeholder="Genero"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <datalist id="catalog-genres">
            {genres.map((genre) => (
              <option key={genre.id} value={genre.nombre} />
            ))}
          </datalist>

          <label className="flex h-11 min-w-0 items-center border-b border-border/80 px-1 transition-colors focus-within:border-black">
            <input
              type="text"
              list="catalog-publishers"
              value={filters.editorial}
              onChange={(event) => updateFilter("editorial", event.target.value)}
              placeholder="Editorial"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <datalist id="catalog-publishers">
            {publishers.map((publisher) => (
              <option key={publisher.id} value={publisher.nombre} />
            ))}
          </datalist>

          <select
            value={filters.tipo_tapa}
            onChange={(event) => updateFilter("tipo_tapa", event.target.value)}
            className="h-11 min-w-0 border-b border-border/80 bg-transparent px-1 text-sm outline-none transition-colors focus:border-black"
          >
            {coverOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.destacado}
            onChange={(event) => updateFilter("destacado", event.target.value as FilterState["destacado"])}
            className="h-11 min-w-0 border-b border-border/80 bg-transparent px-1 text-sm outline-none transition-colors focus:border-black"
          >
            <option value="all">Todos</option>
            <option value="featured">Solo destacados</option>
            <option value="regular">Solo regulares</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-stretch">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5">
              <Filter className="h-4 w-4" />
              {isFilterLoading ? "Actualizando..." : totalBooksLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 w-full items-center justify-center rounded-full border border-border/80 px-4 text-sm font-semibold transition-colors hover:bg-muted sm:w-auto xl:w-full"
          >
            Limpiar
          </button>
        </div>
      </aside>

      <section className="space-y-4">
        {error ? (
          <div className="rounded-[2rem] border border-destructive/20 bg-destructive/8 px-6 py-5 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <BookCardSkeleton key={index} />
            ))}
          </div>
        ) : books.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </section>
  )
}
