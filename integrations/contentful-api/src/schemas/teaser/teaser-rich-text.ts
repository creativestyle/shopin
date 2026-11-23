import { z } from 'zod'
import { RichTextLinksSchema } from '../rich-text'

export const TeaserRichTextApiResponseSchema = z.object({
  __typename: z.literal('TeaserRichText'),
  title: z.string().optional().nullable(),
  richText: z
    .object({
      json: z.unknown().optional().nullable(),
      links: RichTextLinksSchema.optional(),
    })
    .optional()
    .nullable(),
})

export type TeaserRichTextApiResponse = z.infer<
  typeof TeaserRichTextApiResponseSchema
>
