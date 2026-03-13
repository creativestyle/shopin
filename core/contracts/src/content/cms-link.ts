import { z } from 'zod'

/** HTML link target attribute values. */
export const LINK_TARGETS = ['_self', '_blank', '_parent', '_top'] as const
export type LinkTarget = (typeof LINK_TARGETS)[number]

/** Use to parse/validate a string as LinkTarget (e.g. from API). */
export const LinkTargetSchema = z.enum(LINK_TARGETS)

export const CmsLinkSchema = z.object({
  label: z.string(),
  url: z.string().optional(),
  ariaLabel: z.string().optional(),
  rel: z.string().optional(),
  title: z.string().optional(),
  noFollow: z.boolean().optional(),
  noIndex: z.boolean().optional(),
  target: LinkTargetSchema.optional(),
})
export type CmsLinkResponse = z.infer<typeof CmsLinkSchema>

/** Button (CTA): link + presentation. Variant/style only here, not on link. */
export const CmsButtonSchema = z.object({
  link: CmsLinkSchema,
  variant: z.string().optional(),
  style: z.string().optional(),
})
export type CmsButtonResponse = z.infer<typeof CmsButtonSchema>
