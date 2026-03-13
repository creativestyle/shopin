import * as React from 'react'
import { useTranslations } from 'next-intl'
import type {
  RichTextDocumentNode,
  RichTextDocumentResponse,
} from '@core/contracts/content/rich-text-document'
import type { RichTextTeaser } from '@core/contracts/content/teaser-rich-text'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  BLOCK_RENDERERS,
  type RenderChildren,
  type RichTextBlockContext,
} from './rich-text-blocks'

function createRenderNode(
  assetUnresolvedLabel: string,
  imagePreload?: boolean
): (node: RichTextDocumentNode, index: number) => React.ReactNode {
  function renderNode(
    node: RichTextDocumentNode,
    index: number
  ): React.ReactNode {
    const type = (node.nodeType ?? '').toString().toLowerCase()
    const renderChildren: RenderChildren = () =>
      node.content?.map((c, i) => renderNode(c, i)) ?? null

    const context: RichTextBlockContext = {
      renderNode,
      assetUnresolvedLabel,
      imagePreload,
    }
    const renderer = BLOCK_RENDERERS[type]
    if (renderer) {
      return renderer(node, index, renderChildren, context)
    }
    if (node.content?.length) {
      return <React.Fragment key={index}>{renderChildren()}</React.Fragment>
    }
    return null
  }
  return renderNode
}

const PROSE_CLASSES = cn(
  'leading-normal text-gray-950',
  '[&>p]:not-first:mt-[1.5em] [&>p]:not-last:mb-[1.5em] [&>p:empty]:my-0',
  '[&_p:empty:first-child]:hidden [&_p:empty:last-child]:hidden',
  '[&_:is(h1,h2,h3,h4,h5,h6)]:mt-[0.5em] [&_:is(h1,h2,h3,h4,h5,h6)]:mb-[0.25em] [&_:is(h1,h2,h3,h4,h5,h6)]:first:mt-0',
  '[&_h1]:text-2xl [&_h1]:font-bold',
  '[&_h2]:text-xl [&_h2]:font-semibold',
  '[&_h3]:text-lg [&_h3]:font-semibold',
  '[&_h4]:text-base [&_h4]:font-semibold',
  '[&_h5]:text-sm [&_h5]:font-semibold',
  '[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-gray-800',
  '[&_:is(ul,ol)]:pl-6 [&_:is(ul,ol)]:my-[1.5em] [&_ul]:list-disc [&_ol]:list-decimal',
  '[&_:is(ul_ul,ol_ol,ul_ol,ol_ul)]:mt-0',
  '[&_hr]:not-first:mt-[1.5em] [&_hr]:not-last:mb-[1.5em] [&_hr]:border-gray-200'
)

export function TeaserRichTextBlock({
  teaser,
  richText,
  imagePreload,
}: {
  teaser?: RichTextTeaser
  richText?: RichTextDocumentResponse | null
  imagePreload?: boolean
}) {
  const t = useTranslations('teaser')
  const doc = teaser?.richText ?? richText ?? null
  const title = teaser?.title

  if (!doc?.content?.length) {
    return null
  }

  const renderNode = createRenderNode(
    t('richText.assetUnresolved'),
    imagePreload
  )
  const content = doc.content.map((node, i) => renderNode(node, i))

  return (
    <Card
      scheme='gray'
      className='p-4'
    >
      {title && (
        <h2 className='mb-3 text-xl font-semibold text-gray-900'>{title}</h2>
      )}
      <div className={PROSE_CLASSES}>{content}</div>
    </Card>
  )
}
