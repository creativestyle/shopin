import type { RichTextTeaser } from '@core/contracts/content/teaser-rich-text'
import { RichTextDocumentResponseSchema } from '@core/contracts/content/rich-text-document'
import type { TeaserRichTextApiResponse } from '../../schemas/teaser/teaser-rich-text'
import { mergeRichTextAssetLinks, normalizeRichTextLinkData } from './rich-text'

/** Maps Contentful TeaserRichText entry to contract RichTextTeaser. */
export function mapTeaserRichText(
  entry: TeaserRichTextApiResponse
): RichTextTeaser {
  const richTextJson = entry.richText?.json
  const richTextLinks = entry.richText?.links

  let document =
    richTextJson != null
      ? RichTextDocumentResponseSchema.safeParse(richTextJson).data
      : undefined

  if (document && richTextLinks) {
    document = mergeRichTextAssetLinks(document, richTextLinks)
  }

  if (document) {
    document = normalizeRichTextLinkData(document)
  }

  return {
    type: 'richText',
    title: entry.title ?? undefined,
    richText: document,
  }
}
