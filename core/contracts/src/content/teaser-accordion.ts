import { z } from 'zod'
import { RichTextDocumentResponseSchema } from './rich-text-document'

/** One item in an accordion: title and optional rich text body. */
export const AccordionItemSchema = z.object({
  title: z.string(),
  body: RichTextDocumentResponseSchema.optional(),
})
export type AccordionItem = z.infer<typeof AccordionItemSchema>

/** Accordion component – page component with title and items */
export const AccordionTeaserSchema = z.object({
  type: z.literal('accordion'),
  title: z.string().optional(),
  items: z.array(AccordionItemSchema),
})
export type AccordionTeaser = z.infer<typeof AccordionTeaserSchema>
