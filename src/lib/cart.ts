import type { Cart } from "@/pages/types"

const BOOK_WEIGHT_KG = 0.5
const BOX_WEIGHT_KG = 0.2

const SMALL_PACKAGE_DIMENSIONS = {
  length: 25,
  width: 18,
  height: 10,
}

const LARGE_PACKAGE_DIMENSIONS = {
  length: 32,
  width: 24,
  height: 14,
}

export function formatCurrency(value: string | number, currency = "CLP") {
  const numericValue = typeof value === "number" ? value : Number(value)

  if (Number.isNaN(numericValue)) {
    return `${currency} ${value}`
  }

  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

export function getCartBookCount(cart: Cart | null) {
  if (!cart) {
    return 0
  }

  return cart.items.reduce((total, item) => total + item.quantity, 0)
}

export function getCartPackage(cart: Cart | null) {
  const quantity = getCartBookCount(cart)
  const dimensions = quantity > 3 ? LARGE_PACKAGE_DIMENSIONS : SMALL_PACKAGE_DIMENSIONS
  const weight = Number((quantity * BOOK_WEIGHT_KG + BOX_WEIGHT_KG).toFixed(2))

  return {
    quantity,
    package: {
      weight,
      ...dimensions,
    },
  }
}
