import axios from "axios"
import { buildHumanApiErrorMessage } from "@/lib/human-errors"

export type ChilexpressStreet = {
  streetId: number
  streetName: string
  countyName: string
  roadType: string
}

export type ChilexpressRateOption = {
  serviceTypeCode: number
  serviceDescription: string
  didUseVolumetricWeight: boolean
  finalWeight: string
  serviceValue: string
  conditions: string
  deliveryType: number
  additionalServices: unknown[]
}

type StreetSearchPayload = {
  countyName: string
  streetName: string
  pointsOfInterestEnabled?: boolean
  streetNameEnabled?: boolean
  roadType?: number
}

type RatePayload = {
  originCountyCode: string
  destinationCountyCode: string
  package: {
    weight: string
    height: string
    width: string
    length: string
  }
  productType: number
  contentType: number
  declaredWorth: string
  deliveryTime: number
}

const COVERAGE_API_KEY =
  import.meta.env.VITE_CHILEXPRESS_API_COBERTURA_KEY ?? import.meta.env.CHILEXPRESS_API_COBERTURA_KEY
const RATES_API_KEY =
  import.meta.env.VITE_CHILEXPRESS_API_COTIZADOR_KEY ??
  import.meta.env.CHILEXPRESS_API_COTIZADOR_KEY ??
  import.meta.env.VITE_CHILEXPRESS_API_COBERTURA_KEY ??
  import.meta.env.CHILEXPRESS_API_COBERTURA_KEY
const CHILEXPRESS_ORIGIN_COUNTY_CODE = "STGO"
const CHILEXPRESS_API_BASE_URL = import.meta.env.VITE_CHILEXPRESS_API_BASE_URL ?? "http://testservices.wschilexpress.com"

const chilexpressApi = axios.create({
  baseURL: CHILEXPRESS_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

function buildApiErrorMessage(error: unknown, fallback: string) {
  return buildHumanApiErrorMessage(error, fallback)
}

function getRequiredKey(key: string | undefined, keyName: string) {
  if (!key) {
    throw new Error(`Falta configurar ${keyName} en el frontend.`)
  }

  return key
}

function assertCountyCode(value: string, field: "originCountyCode" | "destinationCountyCode") {
  if (!/^[A-Z0-9]{4}$/.test(value)) {
    throw new Error(`${field} inválido (${value}). Debe ser un código de cobertura de 4 caracteres.`)
  }
}

export function getChilexpressOriginCountyCode() {
  return CHILEXPRESS_ORIGIN_COUNTY_CODE
}

export async function searchChilexpressStreets(payload: StreetSearchPayload, limit = 6) {
  const apiKey = getRequiredKey(COVERAGE_API_KEY, "VITE_CHILEXPRESS_API_COBERTURA_KEY")

  try {
    const { data } = await chilexpressApi.post<{ streets?: ChilexpressStreet[] }>(
      "/georeference/api/v1.0/streets/search",
      {
        pointsOfInterestEnabled: false,
        streetNameEnabled: true,
        roadType: 0,
        ...payload,
      },
      {
        params: { limit },
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      }
    )

    return data.streets ?? []
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudieron consultar las calles en Chilexpress"))
  }
}

export async function quoteChilexpressRate(payload: Omit<RatePayload, "originCountyCode">) {
  const apiKey = getRequiredKey(RATES_API_KEY, "VITE_CHILEXPRESS_API_COTIZADOR_KEY")
  const originCountyCode = CHILEXPRESS_ORIGIN_COUNTY_CODE
  const destinationCountyCode = payload.destinationCountyCode.trim().toUpperCase()
  assertCountyCode(originCountyCode, "originCountyCode")
  assertCountyCode(destinationCountyCode, "destinationCountyCode")

  try {
    const { data } = await chilexpressApi.post<{ data?: { courierServiceOptions?: ChilexpressRateOption[] } }>(
      "/rating/api/v1.0/rates/courier",
      {
        ...payload,
        originCountyCode,
        destinationCountyCode,
      },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      }
    )

    return data.data?.courierServiceOptions ?? []
  } catch (error) {
    throw new Error(buildApiErrorMessage(error, "No se pudo cotizar el envío con Chilexpress"))
  }
}


