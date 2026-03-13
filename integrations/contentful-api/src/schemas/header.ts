import { z } from 'zod'

/** Single top bar entry from Contentful topBarCollection. */
export const TopBarItemApiResponseSchema = z.object({
  topBarMessages: z.string().optional().nullable(),
})

/** GraphQL response shape for layout header (topBarCollection) query. */
export const HeaderLayoutApiResponseSchema = z.object({
  topBarCollection: z
    .object({
      items: z.array(TopBarItemApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
})

export type TopBarItemApiResponse = z.infer<typeof TopBarItemApiResponseSchema>
export type HeaderLayoutApiResponse = z.infer<
  typeof HeaderLayoutApiResponseSchema
>
