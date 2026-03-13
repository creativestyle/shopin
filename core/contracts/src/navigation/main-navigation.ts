import { z } from 'zod'
import { LinkResponseSchema } from '../core/link'

export const MainNavigationResponseSchema = z.object({
  items: z.array(LinkResponseSchema),
})

export type MainNavigationResponse = z.infer<
  typeof MainNavigationResponseSchema
>
