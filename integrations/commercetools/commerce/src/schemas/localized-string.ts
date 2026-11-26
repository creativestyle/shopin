import { z } from 'zod'

export const LocalizedStringApiResponseSchema = z.record(z.string(), z.string())

export type LocalizedStringApiResponse = z.infer<
  typeof LocalizedStringApiResponseSchema
>
