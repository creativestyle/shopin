import { z } from 'zod'
import { ContentfulImageApiResponseSchema } from '../image'
import { LinkEntryApiResponseSchema } from '../link'

const TeaserBrandItemApiResponseSchema = z.object({
  image: ContentfulImageApiResponseSchema,
  caption: z.string().optional().nullable(),
  link: LinkEntryApiResponseSchema.optional().nullable(),
})

export const TeaserBrandApiResponseSchema = z.object({
  __typename: z.literal('TeaserBrand'),
  title: z.string().optional().nullable(),
  brandItemsCollection: z
    .object({
      items: z.array(TeaserBrandItemApiResponseSchema),
    })
    .optional()
    .nullable(),
})

export type TeaserBrandApiResponse = z.infer<
  typeof TeaserBrandApiResponseSchema
>
