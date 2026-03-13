import { z } from 'zod'
import { RichTextDocumentResponseSchema } from './rich-text-document'

/** Rich Text Teaser – formatted rich text (CMS-agnostic document). */
export const RichTextTeaserSchema = z.object({
  type: z.literal('richText'),
  title: z.string().optional(),
  richText: RichTextDocumentResponseSchema.optional(),
})
export type RichTextTeaser = z.infer<typeof RichTextTeaserSchema>
