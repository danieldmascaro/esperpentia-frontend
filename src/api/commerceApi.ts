import axios from "axios"

import { api } from "@/api/client"
import type {
  Cart,
  CartAddItemPayload,
  CartApplyDiscountPayload,
  CartResolvePayload,
  CartUpdateItemPayload,
  CustomerAddress,
  CustomerAddressPayload,
  Order,
  PaginatedResponse,
  PaymentIntent,
  ShippingMethod,
  WebpayCommitResponse,
} from "@/pages/types"

const GUEST_TOKEN_STORAGE_KEY = "esperpentia_guest_token"

function createIdempotencyKey(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

function buildApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    const networkMessage = error.message?.trim()

    if (typeof data === "string" && data.trim().length > 0) {
      return data
    }

    if (data && typeof data === "object") {
      if ("detail" in data && typeof data.detail === "string" && data.detail.trim().length > 0) {
        return data.detail
      }

      const firstValue = Object.values(data).find((value) => {
        if (typeof value === "string") {
          return value.trim().length > 0
        }
        return Array.isArray(value) && value.length > 0
      })

      if (typeof firstValue === "string") {
        return firstValue
      }

      if (Array.isArray(firstValue)) {
        const firstItem = firstValue.find((value) => typeof value === "string" && value.trim().length > 0)
        if (typeof firstItem === "string") {
          return firstItem
        }
      }

      return JSON.stringify(data)
    }

    if (networkMessage) {
      return networkMessage
    }
  }

  return fallback
}

function normalizePaginatedData<T>(data: PaginatedResponse<T> | T[]) {
  return Array.isArray(data) ? data : data.results
}

export function getOrCreateGuestToken() {
  if (typeof window === "undefined") {
    return "guest-ssr"
  }

  const existingToken = window.localStorage.getItem(GUEST_TOKEN_STORAGE_KEY)
  if (existingToken) {
    return existingToken
  }

  const nextToken = `guest-${crypto.randomUUID()}`
  window.localStorage.setItem(GUEST_TOKEN_STORAGE_KEY, nextToken)
  return nextToken
}

function buildGuestHeaders(guestToken?: string) {
  return guestToken ? { "X-Guest-Token": guestToken } : undefined
}

function buildMutationHeaders(guestToken?: string, operation = "cart") {
  return {
    ...buildGuestHeaders(guestToken),
    "Idempotency-Key": createIdempotencyKey(operation),
  }
}

export async function resolveCart(payload: CartResolvePayload = {}) {
  try {
    const body = {
      ...(payload.guest_token ? { guest_token: payload.guest_token } : {}),
      currency: payload.currency ?? "CLP",
    }
    const { data } = await api.post<Cart>("/checkout/carts/resolve/", body)
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo resolver el carrito"))
  }
}

export async function getCurrentCart(guestToken?: string) {
  try {
    const { data } = await api.get<Cart>("/checkout/carts/current/", {
      headers: buildGuestHeaders(guestToken),
    })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw new Error(buildApiErrorMessage(error, "No se pudo cargar el carrito actual"))
  }
}

export async function addCartItem(cartId: string, payload: CartAddItemPayload, guestToken?: string) {
  try {
    const { data } = await api.post<Cart>(`/checkout/carts/${cartId}/add-item/`, payload, {
      headers: buildMutationHeaders(guestToken, "add-item"),
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo agregar el libro al carrito"))
  }
}

export async function updateCartItem(
  cartId: string,
  itemId: string,
  payload: CartUpdateItemPayload,
  guestToken?: string
) {
  try {
    const { data } = await api.patch<Cart>(`/checkout/carts/${cartId}/items/${itemId}/`, payload, {
      headers: buildMutationHeaders(guestToken, "update-item"),
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo actualizar el item del carrito"))
  }
}

export async function removeCartItem(cartId: string, itemId: string, guestToken?: string) {
  try {
    const { data } = await api.delete<Cart>(`/checkout/carts/${cartId}/items/${itemId}/`, {
      headers: buildMutationHeaders(guestToken, "remove-item"),
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo eliminar el item del carrito"))
  }
}

export async function applyCartDiscount(
  cartId: string,
  payload: CartApplyDiscountPayload,
  guestToken?: string
) {
  try {
    const { data } = await api.post<Cart>(`/checkout/carts/${cartId}/apply-discount/`, payload, {
      headers: buildMutationHeaders(guestToken, "apply-discount"),
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo aplicar el descuento"))
  }
}

export async function recalculateCart(cartId: string, guestToken?: string) {
  try {
    const { data } = await api.post<Cart>(
      `/checkout/carts/${cartId}/recalculate/`,
      undefined,
      { headers: buildMutationHeaders(guestToken, "recalculate") }
    )
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo recalcular el carrito"))
  }
}

export async function convertCart(cartId: string, guestToken?: string) {
  try {
    const { data } = await api.post<Cart>(
      `/checkout/carts/${cartId}/convert/`,
      undefined,
      { headers: buildMutationHeaders(guestToken, "convert") }
    )
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo convertir el carrito en orden"))
  }
}

export async function getMyOrders() {
  try {
    const { data } = await api.get<PaginatedResponse<Order> | Order[]>("/orders/me/")
    return normalizePaginatedData(data)
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron cargar las ordenes"))
  }
}

export async function getOrder(orderId: string) {
  try {
    const { data } = await api.get<Order>(`/orders/${orderId}/`)
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo cargar la orden"))
  }
}

export async function getShippingMethods() {
  try {
    const { data } = await api.get<PaginatedResponse<ShippingMethod> | ShippingMethod[]>("/shipping/methods/")
    return normalizePaginatedData(data)
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron cargar los metodos de envio"))
  }
}

export async function getCustomerAddresses() {
  try {
    const { data } = await api.get<PaginatedResponse<CustomerAddress> | CustomerAddress[]>("/shipping/address/")
    return normalizePaginatedData(data)
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron cargar las direcciones"))
  }
}

export async function createCustomerAddress(payload: CustomerAddressPayload) {
  try {
    const { data } = await api.post<CustomerAddress>("/shipping/address/", payload)
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo crear la direccion"))
  }
}

export async function createPaymentIntent(orderId: string, provider: "mockpay" | "webpay" = "mockpay") {
  try {
    const { data } = await api.post<PaymentIntent>("/payments/create-intent/", {
      order_id: orderId,
      provider,
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo crear el intento de pago"))
  }
}

export async function commitWebpay(tokenWs: string) {
  try {
    const { data } = await api.post<WebpayCommitResponse>("/payments/webpay/commit/", {
      token_ws: tokenWs,
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo confirmar el pago en Webpay"))
  }
}

export async function getWebpayStatus(tokenWs: string) {
  try {
    const { data } = await api.get<Record<string, unknown>>("/payments/webpay/status/", {
      params: { token_ws: tokenWs },
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo consultar el estado de Webpay"))
  }
}

export async function refundWebpay(tokenWs: string, amount: string) {
  try {
    const { data } = await api.post<WebpayCommitResponse>("/payments/webpay/refund/", {
      token_ws: tokenWs,
      amount,
    })
    return data
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo solicitar el reembolso"))
  }
}
