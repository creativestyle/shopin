import { z } from 'zod'

export const BaseOptionItemResponseSchema = z.object({
  label: z.string(),
  disabled: z.boolean().optional(),
})

export type BaseOptionItemResponse = z.infer<
  typeof BaseOptionItemResponseSchema
>

export const ColorOptionItemResponseSchema =
  BaseOptionItemResponseSchema.extend({
    swatch: z.string(),
  })

export type ColorOptionItemResponse = z.infer<
  typeof ColorOptionItemResponseSchema
>

export const ImageOptionItemResponseSchema =
  BaseOptionItemResponseSchema.extend({
    imageSrc: z.string(),
  })

export type ImageOptionItemResponse = z.infer<
  typeof ImageOptionItemResponseSchema
>

export type ValueOptionItemResponse = BaseOptionItemResponse
