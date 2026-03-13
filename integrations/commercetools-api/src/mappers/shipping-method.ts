import { z } from 'zod'
import type {
  ShippingMethodResponse,
  ShippingMethodsResponse,
} from '@core/contracts/cart/shipping-method'
import { ShippingMethodsResponseSchema } from '@core/contracts/cart/shipping-method'
import { LocalizedStringApiResponseSchema } from '../schemas/localized-string'
import { getLocalizedString } from '../helpers/get-localized-string'

const TypedMoneyApiResponseSchema = z.object({
  centAmount: z.number(),
  currencyCode: z.string(),
})

const ShippingRateApiResponseSchema = z.object({
  price: TypedMoneyApiResponseSchema,
  freeAbove: TypedMoneyApiResponseSchema.optional(),
})

const ZoneRateApiResponseSchema = z.object({
  shippingRates: z.array(ShippingRateApiResponseSchema),
})

export const ShippingMethodApiResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  localizedDescription: LocalizedStringApiResponseSchema.optional(),
  zoneRates: z.array(ZoneRateApiResponseSchema),
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
): ShippingMethodResponse {
  // Get the first shipping rate from the first zone rate
  // In a real scenario, you'd match the zone based on the cart's shipping address
  const firstZoneRate = shippingMethod.zoneRates?.[0]
  const firstShippingRate = firstZoneRate?.shippingRates?.[0]

  const price = firstShippingRate?.price || {
    centAmount: 0,
    currencyCode: currency,
  }

  const freeAbove = firstShippingRate?.freeAbove

  const localizedDescription = shippingMethod.localizedDescription
    ? getLocalizedString(shippingMethod.localizedDescription, language)
    : undefined

  return {
    id: shippingMethod.id,
    name: shippingMethod.name,
    localizedDescription: localizedDescription
      ? { [language]: localizedDescription }
      : undefined,
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
