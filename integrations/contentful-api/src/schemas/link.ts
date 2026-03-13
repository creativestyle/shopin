import { z } from 'zod'

/** Link entry from Contentful (label, url, a11y, target; no variant/style). */
export const LinkEntryApiResponseSchema = z.object({
  label: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  ariaLabel: z.string().optional().nullable(),
  rel: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  noFollow: z.boolean().optional().nullable(),
  noIndex: z.boolean().optional().nullable(),
  target: z.string().optional().nullable(),
})

/** Button entry (link + variant + style). Variant/style only on Button. */
export const ButtonEntryApiResponseSchema = z.object({
  link: LinkEntryApiResponseSchema.optional().nullable(),
  variant: z.string().optional().nullable(),
  style: z.string().optional().nullable(),
})

export type LinkEntryApiResponse = z.infer<typeof LinkEntryApiResponseSchema>
export type ButtonEntryApiResponse = z.infer<
  typeof ButtonEntryApiResponseSchema
>
