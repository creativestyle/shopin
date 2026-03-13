import type { AccordionTeaser } from '@core/contracts/content/teaser-accordion'
import {
  RichTextDocumentResponseSchema,
  type RichTextDocumentResponse,
} from '@core/contracts/content/rich-text-document'
import {
  type TeaserAccordionApiResponse,
  AccordionItemBodySchema,
} from '../../schemas/teaser/teaser-accordion'

/** Maps Contentful TeaserAccordion entry to contract AccordionTeaser. */
export function mapTeaserAccordion(
  entry: TeaserAccordionApiResponse
): AccordionTeaser {
  const accordion = entry.accordion
  const items = (accordion?.itemsCollection?.items ?? []).map(
    (accordionItem) => {
      const rawBody = accordionItem.body
      const bodyParsed = AccordionItemBodySchema.safeParse(rawBody)
      let body: RichTextDocumentResponse | undefined
      if (bodyParsed.success) {
        if (typeof bodyParsed.data === 'string') {
          body =
            bodyParsed.data.trim() !== ''
              ? {
                  nodeType: 'document',
                  content: [
                    {
                      nodeType: 'paragraph',
                      content: [{ nodeType: 'text', value: bodyParsed.data }],
                    },
                  ],
                }
              : undefined
        } else {
          const docParsed = RichTextDocumentResponseSchema.safeParse(
            bodyParsed.data.json
          )
          body = docParsed.success ? docParsed.data : undefined
        }
      }
      return {
        title: accordionItem.title ?? '',
        body,
      }
    }
  )
  return {
    type: 'accordion',
    title: entry.title ?? accordion?.title ?? undefined,
    items,
  }
}
