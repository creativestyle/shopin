import { z } from 'zod'

/** Contentful Asset fields (matches AssetFragment). Used by teasers, ogImage, etc. */
export const ContentfulImageApiResponseSchema = z
  .object({
    url: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    width: z.number().optional().nullable(),
    height: z.number().optional().nullable(),
  })
  .optional()
  .nullable()

export type ContentfulImageApiResponse = z.infer<
  typeof ContentfulImageApiResponseSchema
>
