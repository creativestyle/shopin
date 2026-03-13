import { z } from 'zod'
import {
  BaseOptionItemResponseSchema,
  ColorOptionItemResponseSchema,
  ImageOptionItemResponseSchema,
} from './option-item'

export const ConfigurableOptionResponseSchema = z.discriminatedUnion('type', [
  z.object({
    key: z.string(),
    label: z.string(),
    type: z.literal('string'),
    options: z.array(BaseOptionItemResponseSchema),
  }),
  z.object({
    key: z.string(),
    label: z.string(),
    type: z.literal('color'),
    options: z.array(ColorOptionItemResponseSchema),
  }),
  z.object({
    key: z.string(),
    label: z.string(),
    type: z.literal('image'),
    options: z.array(ImageOptionItemResponseSchema),
  }),
])

export type ConfigurableOptionResponse = z.infer<
  typeof ConfigurableOptionResponseSchema
>
