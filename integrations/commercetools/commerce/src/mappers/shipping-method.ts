import { z } from 'zod'
import type {
  ShippingMethodResponse,
  ShippingMethodsResponse,
} from '@core/contracts/cart/shipping-method'
import { ShippingMethodsResponseSchema } from '@core/contracts/cart/shipping-method'
import { LocalizedStringApiResponseSchema } from '../schemas/localized-string'
import {
  SHIPPING_METHOD_DELIVERY_TIME_FIELD,
  ShippingMethodCustomApiResponseSchema,
} from '../schemas/shipping-method-custom'
import { getLocalizedString } from '../helpers/get-localized-string'

const TypedMoneyApiResponseSchema = z.object({
  centAmount: z.number(),
  currencyCode: z.string(),
})

const ShippingRateApiResponseSchema = z.object({
  price: TypedMoneyApiResponseSchema,
  freeAbove: TypedMoneyApiResponseSchema.optional(),
  isMatching: z.boolean().optional(),
})

const ZoneRateApiResponseSchema = z.object({
  shippingRates: z.array(ShippingRateApiResponseSchema),
})

export const ShippingMethodApiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  localizedName: LocalizedStringApiResponseSchema.optional(),
  localizedDescription: LocalizedStringApiResponseSchema.optional(),
  zoneRates: z.array(ZoneRateApiResponseSchema),
  custom: ShippingMethodCustomApiResponseSchema,
  isDefault: z.boolean().optional(),
})

export type ShippingMethodApiResponse = z.infer<
  typeof ShippingMethodApiResponseSchema
>

/**
 * Maps commercetools shipping method API response to contract format
 */
function mapShippingMethodToResponse(
  shippingMethod: ShippingMethodApiResponse,
  language: string,
  currency: string
): ShippingMethodResponse | null {
  // A zone can span several currencies, so pick the rate the cart actually matches
  const rates = shippingMethod.zoneRates?.flatMap(
    (zr) => zr.shippingRates ?? []
  )
  const rate =
    rates?.find((r) => r.isMatching) ??
    rates?.find((r) => r.price.currencyCode === currency)

  if (!rate) {
    return null
  }

  const price = rate.price
  const freeAbove = rate.freeAbove

  const name =
    getLocalizedString(shippingMethod.localizedName, language) ??
    shippingMethod.name

  const description = getLocalizedString(
    shippingMethod.localizedDescription,
    language
  )

  const deliveryTime = getLocalizedString(
    shippingMethod.custom?.fields?.[SHIPPING_METHOD_DELIVERY_TIME_FIELD],
    language
  )

  return {
    id: shippingMethod.id,
    name,
    description,
    deliveryTime,
    price: {
      centAmount: price.centAmount,
      currencyCode: price.currencyCode,
    },
    freeAbove: freeAbove
      ? {
          centAmount: freeAbove.centAmount,
          currencyCode: freeAbove.currencyCode,
        }
      : undefined,
    isDefault: shippingMethod.isDefault ?? false,
  }
}

/**
 * Maps commercetools shipping methods API response to contract format
 */
export function mapShippingMethodsToResponse(
  shippingMethods: unknown[],
  language: string,
  currency: string
): ShippingMethodsResponse {
  const mappedMethods = shippingMethods
    .map((method) => {
      const parsed = ShippingMethodApiResponseSchema.safeParse(method)
      if (!parsed.success) {
        return null
      }
      return mapShippingMethodToResponse(parsed.data, language, currency)
    })
    .filter((method): method is ShippingMethodResponse => method !== null)

  return ShippingMethodsResponseSchema.parse({
    shippingMethods: mappedMethods,
  })
}
