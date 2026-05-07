import axios from "axios"

const fieldLabels: Record<string, string> = {
  email: "el email",
  password: "la contraseña",
  re_password: "la confirmación de contraseña",
  new_password: "la nueva contraseña",
  re_new_password: "la confirmación de la nueva contraseña",
  current_password: "la contraseña actual",
  token: "el enlace de recuperación",
  uid: "el enlace de recuperación",
  detail: "la solicitud",
}

function toCleanSentence(text: string) {
  const value = text.trim()
  if (!value) return ""
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function mapKnownMessage(message: string) {
  const normalized = message.trim().toLowerCase()

  if (normalized.includes("no active account found")) {
    return "El email o la contraseña no coinciden."
  }
  if (normalized.includes("credentials were not provided")) {
    return "Debes iniciar sesión para continuar."
  }
  if (normalized.includes("token is invalid") || normalized.includes("given token not valid")) {
    return "El enlace no es válido o ya venció. Solicita uno nuevo."
  }
  if (normalized.includes("authentication credentials were not provided")) {
    return "Tu sesión expiró. Inicia sesión nuevamente."
  }
  if (normalized.includes("field may not be blank")) {
    return "Completa este campo para continuar."
  }
  if (normalized.includes("this field is required")) {
    return "Este campo es obligatorio."
  }

  return toCleanSentence(message)
}

function fromObjectData(data: Record<string, unknown>) {
  if (typeof data.detail === "string" && data.detail.trim()) {
    return mapKnownMessage(data.detail)
  }

  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    const first = data.non_field_errors.find((value) => typeof value === "string")
    if (typeof first === "string") {
      return mapKnownMessage(first)
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string" && value.trim()) {
      const label = fieldLabels[key]
      return label ? `Revisa ${label}: ${mapKnownMessage(value).toLowerCase()}` : mapKnownMessage(value)
    }

    if (Array.isArray(value) && value.length > 0) {
      const first = value.find((item) => typeof item === "string" && item.trim())
      if (typeof first === "string") {
        const label = fieldLabels[key]
        return label ? `Revisa ${label}: ${mapKnownMessage(first).toLowerCase()}` : mapKnownMessage(first)
      }
    }
  }

  return null
}

export function buildHumanApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) {
    return fallback
  }

  if (!error.response) {
    return "No pudimos conectar con el servidor. Intenta nuevamente."
  }

  const { status, data } = error.response

  if (status === 429) {
    return "Hiciste demasiados intentos en poco tiempo. Espera un momento e inténtalo de nuevo."
  }

  if (typeof data === "string" && data.trim()) {
    return mapKnownMessage(data)
  }

  if (data && typeof data === "object") {
    const parsed = fromObjectData(data as Record<string, unknown>)
    if (parsed) {
      return parsed
    }
  }

  if (status >= 500) {
    return "Tuvimos un problema interno. Intenta nuevamente en unos minutos."
  }

  return fallback
}
