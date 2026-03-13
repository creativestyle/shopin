import * as React from 'react'
import Link from 'next/link'
import type { RichTextDocumentNode } from '@core/contracts/content/rich-text-document'
import { getLinkHref, isHyperlink } from '../lib/rich-text-utils'

const linkClassName = 'text-primary underline hover:no-underline'

type MarkRenderer = (content: React.ReactNode) => React.ReactNode

const MARK_RENDERERS: Record<string, MarkRenderer> = {
  bold: (content) => <strong>{content}</strong>,
  italic: (content) => <em>{content}</em>,
  underline: (content) => <span className='underline'>{content}</span>,
  code: (content) => (
    <code className='rounded bg-gray-200 px-1 py-0.5 font-mono text-sm'>
      {content}
    </code>
  ),
}

const defaultMarkRenderer: MarkRenderer = (content) => <span>{content}</span>

export type RenderInline = (
  node: RichTextDocumentNode,
  index: number
) => React.ReactNode

export type InlineRenderer = (
  node: RichTextDocumentNode,
  index: number,
  context: { renderInline: RenderInline }
) => React.ReactNode

export const INLINE_RENDERERS: Record<string, InlineRenderer> = {
  text: (node, index) => {
    if (node.value === undefined) {
      return null
    }
    let content: React.ReactNode = node.value
    for (const mark of node.marks ?? []) {
      const renderer = MARK_RENDERERS[mark.type] ?? defaultMarkRenderer
      content = renderer(content)
    }
    return <React.Fragment key={index}>{content}</React.Fragment>
  },
  hyperlink: (node, index, context) => {
    const href = getLinkHref(node)
    const inner = node.content?.length
      ? node.content.map((c, i) => context.renderInline(c, i))
      : isHyperlink(node)
        ? node.data?.label
        : undefined

    if (!href) {
      return (
        <span
          key={index}
          className={linkClassName}
        >
          {inner}
        </span>
      )
    }
    const isInternal = href.startsWith('/') && !href.startsWith('//')
    if (isInternal) {
      return (
        <Link
          key={index}
          href={href}
          className={linkClassName}
        >
          {inner}
        </Link>
      )
    }
    return (
      <a
        key={index}
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={linkClassName}
      >
        {inner}
      </a>
    )
  },
}

export function renderInline(
  node: RichTextDocumentNode,
  index: number
): React.ReactNode {
  const type = (node.nodeType ?? '').toString().toLowerCase()
  const renderer = INLINE_RENDERERS[type]
  if (renderer) {
    return renderer(node, index, { renderInline })
  }
  if (node.content?.length) {
    return (
      <React.Fragment key={index}>
        {node.content.map((c, i) => renderInline(c, i))}
      </React.Fragment>
    )
  }
  return null
}
