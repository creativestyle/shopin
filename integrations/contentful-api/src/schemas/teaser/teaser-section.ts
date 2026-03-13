import { z } from 'zod'
import { LinkEntryApiResponseSchema } from '../link'
import { ContentfulImageApiResponseSchema } from '../image'

export const TeaserSectionApiResponseSchema = z.object({
  __typename: z.literal('TeaserSection'),
  categoryLabel: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  subcategoryLinkEntriesCollection: z
    .object({
      items: z.array(LinkEntryApiResponseSchema),
    })
    .optional()
    .nullable(),
  image: ContentfulImageApiResponseSchema,
})

export type TeaserSectionApiResponse = z.infer<
  typeof TeaserSectionApiResponseSchema
>
