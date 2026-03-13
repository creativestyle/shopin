import { z } from 'zod'
import { I18N_CONFIG } from '@config/constants'
import { ContentfulImageApiResponseSchema } from './image'
import { TeaserEntryApiResponseSchema } from './teaser'

/** GraphQL alias for locale slug: "en-US" -> "slug_en_US". */
export function localeSlugKey(locale: string): string {
  return `slug_${locale.replace(/-/g, '_')}`
}

const localeSlugFields = Object.fromEntries(
  I18N_CONFIG.supportedLanguages.map((locale) => [
    localeSlugKey(locale),
    z.string().optional().nullable(),
  ])
)

/** Single page item from Contentful pageCollection. */
export const PageItemApiResponseSchema = z.object({
  slug: z.string(),
  ...localeSlugFields,
  pageTitle: z.string().optional().nullable(),
  pageTitleVisibility: z.string().optional().nullable(),
  parentPage: z
    .object({
      slug: z.string().optional().nullable(),
      pageTitle: z.string().optional().nullable(),
      parentPage: z.unknown().optional().nullable(),
    })
    .optional()
    .nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  ogImage: ContentfulImageApiResponseSchema,
  noIndex: z.boolean().optional().nullable(),
  componentsCollection: z
    .object({
      items: z.array(TeaserEntryApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
})

/** GraphQL response shape for pageCollection query. */
export const PageCollectionApiResponseSchema = z.object({
  pageCollection: z
    .object({
      items: z.array(PageItemApiResponseSchema).optional().nullable(),
    })
    .optional()
    .nullable(),
})

export type PageItemApiResponse = z.infer<typeof PageItemApiResponseSchema>
export type PageCollectionApiResponse = z.infer<
  typeof PageCollectionApiResponseSchema
>
