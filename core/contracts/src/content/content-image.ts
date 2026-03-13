import { z } from 'zod'

/** CMS image with url, required alt (for a11y), and optional metadata. Mappers must set alt (e.g. from title/description or ''). */
export const ContentImageSchema = z.object({
  url: z.string(),
  /** Required for accessibility. Set by BFF/integrations from CMS title/description or ''. */
  alt: z.string(),
  title: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})
export type ContentImage = z.infer<typeof ContentImageSchema>
