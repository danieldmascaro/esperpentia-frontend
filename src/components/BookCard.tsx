import { useState } from "react"
import { BookOpenText, ShoppingCart } from "lucide-react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useCart } from "@/commerce/useCart"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveMediaUrl } from "@/lib/api"
import { formatCurrency } from "@/lib/cart"
import { softRiseItem } from "@/lib/motion"
import type { CatalogBook } from "@/pages/types"

type BookCardProps = {
  book: CatalogBook
}

function getBookImage(book: CatalogBook) {
  return resolveMediaUrl(book.imagen)
}

export function BookCard({ book }: BookCardProps) {
  const imageSrc = getBookImage(book)
  const navigate = useNavigate()
  const { addBookToCart, buyNow } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)

  return (
    <article className="group flex h-auto min-h-[30rem] flex-col overflow-hidden border border-border/70 bg-card shadow-sm sm:h-[34rem] sm:min-h-0">
      <div className="bg-black px-5 py-4 text-white">
        <p className="text-lg font-semibold leading-tight sm:text-xl">{book.nombre}</p>
        <p className="mt-1 text-sm text-white/72">{book.autor.nombre}</p>
        <p className="mt-1 text-sm text-white/72">{book.editorial.nombre}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex h-52 w-full shrink-0 items-center justify-center overflow-hidden bg-muted/60">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={book.nombre}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <BookOpenText className="h-10 w-10" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Precio</p>
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(book.precio, book.moneda)}
            </p>
          </div>

          <Button
            type="button"
            variant="black"
            size="lg"
            className="h-9 shrink-0 self-center rounded-full px-4 text-sm font-semibold whitespace-nowrap"
            disabled={isAdding || isBuyingNow}
            onClick={() => {
              setIsAdding(true)
              void addBookToCart(book.id)
                .then(() => {
                  toast.success("Libro agregado al carrito")
                })
                .catch((error) => {
                  toast.error(error instanceof Error ? error.message : "No se pudo agregar el libro al carrito")
                })
                .finally(() => {
                  setIsAdding(false)
                })
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            Anadir al carrito
          </Button>
        </div>

        <div className="flex justify-center">
          <Button
            variant="black"
            size="lg"
            nativeButton={false}
            render={<Link to={`/catalogo/${book.id}`} />}
            className="h-9 max-w-full rounded-full px-4 text-sm font-semibold whitespace-nowrap"
          >
            Ver detalles
          </Button>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAdding || isBuyingNow}
            onClick={() => {
              setIsBuyingNow(true)
              void buyNow(book.id)
                .then(() => {
                  navigate("/checkout")
                })
                .catch((error) => {
                  toast.error(error instanceof Error ? error.message : "No se pudo preparar el carrito")
                })
                .finally(() => {
                  setIsBuyingNow(false)
                })
            }}
          >
            COMPRAR AHORA
          </button>
        </div>
      </div>
    </article>
  )
}

export function BookCardSkeleton() {
  return (
    <motion.section
      className="flex h-auto min-h-[30rem] flex-col overflow-hidden border border-border/70 bg-card shadow-sm sm:h-[34rem] sm:min-h-0"
      variants={softRiseItem}
      initial="hidden"
      animate="show"
    >
      <div className="bg-black px-5 py-4">
        <Skeleton className="h-6 w-3/4 bg-white/15" />
        <Skeleton className="mt-2 h-4 w-1/2 bg-white/15" />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <Skeleton className="h-52 w-full shrink-0" />

        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-9 w-36 rounded-full bg-black/90" />
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-9 w-32 rounded-full bg-black/90" />
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </motion.section>
  )
}
