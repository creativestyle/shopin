import { z } from 'zod'

/** Text Teaser – plain text block */
export const TextTeaserSchema = z.object({
  type: z.literal('text'),
  body: z.string(),
})
export type TextTeaser = z.infer<typeof TextTeaserSchema>
