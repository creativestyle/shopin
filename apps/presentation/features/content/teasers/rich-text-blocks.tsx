import * as React from 'react'
import { ContentImage } from '@/features/content/content-image'
import type { RichTextDocumentNode } from '@core/contracts/content/rich-text-document'
import {
  getTextContent,
  isEmbeddedAssetBlock,
  nodeTypeIs,
} from '../lib/rich-text-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { renderInline } from './rich-text-inline'

export type RenderChildren = () => React.ReactNode
export type RenderNode = (
  node: RichTextDocumentNode,
  index: number
) => React.ReactNode
export type RichTextBlockContext = {
  renderNode: RenderNode
  assetUnresolvedLabel: string
  imagePreload?: boolean
}
export type BlockRenderer = (
  node: RichTextDocumentNode,
  index: number,
  children: RenderChildren,
  context?: RichTextBlockContext
) => React.ReactNode

function inlineContent(node: RichTextDocumentNode): React.ReactNode {
  return node.content?.map((c, j) => renderInline(c, j))
}

export const BLOCK_RENDERERS: Record<string, BlockRenderer> = {
  'paragraph': (node, index) => <p key={index}>{inlineContent(node)}</p>,
  'heading-1': (node, index) => <h1 key={index}>{inlineContent(node)}</h1>,
  'heading-2': (node, index) => <h2 key={index}>{inlineContent(node)}</h2>,
  'heading-3': (node, index) => <h3 key={index}>{inlineContent(node)}</h3>,
  'heading-4': (node, index) => <h4 key={index}>{inlineContent(node)}</h4>,
  'heading-5': (node, index) => <h5 key={index}>{inlineContent(node)}</h5>,
  'heading-6': (node, index) => <h6 key={index}>{inlineContent(node)}</h6>,
  'unordered-list': (_, index, children) => <ul key={index}>{children()}</ul>,
  'ordered-list': (_, index, children) => <ol key={index}>{children()}</ol>,
  'list-item': (_, index, children) => <li key={index}>{children()}</li>,
  'blockquote': (_, index, children) => (
    <blockquote
      key={index}
      className='my-6 border-l-4 border-gray-300 pl-4 leading-[1.3] font-bold text-gray-700 italic'
    >
      {children()}
    </blockquote>
  ),
  'hr': (_, index) => (
    <hr
      key={index}
      className='my-6 border-0 border-t border-gray-200'
    />
  ),
  'table-row': (_, index, children) => (
    <TableRow key={index}>{children()}</TableRow>
  ),
  'table': (node, index, _children, context) => {
    if (!node.content?.length || !context) {
      return null
    }
    const rows = node.content.filter((c) => nodeTypeIs(c, 'table-row'))
    const headerRows = rows.filter((r) =>
      r.content?.some((c) => nodeTypeIs(c, 'table-header-cell'))
    )
    const bodyRows = rows.filter(
      (r) => !r.content?.some((c) => nodeTypeIs(c, 'table-header-cell'))
    )
    return (
      <div
        key={index}
        className='my-6 overflow-x-auto'
      >
        <Table type='scrollable'>
          {headerRows.length > 0 && (
            <TableHeader>
              {headerRows.map((r, i) => context.renderNode(r, i))}
            </TableHeader>
          )}
          <TableBody>
            {bodyRows.map((r, i) => context.renderNode(r, i))}
          </TableBody>
        </Table>
      </div>
    )
  },
  'table-header-cell': (_, index, children) => (
    <TableHead key={index}>{children()}</TableHead>
  ),
  'table-cell': (node, index, children) => {
    const dataTitle = getTextContent(node).trim() || undefined
    return (
      <TableCell
        key={index}
        data-title={dataTitle}
      >
        {children()}
      </TableCell>
    )
  },
  'embedded-asset-block': (node, index, _children, context) => {
    if (!isEmbeddedAssetBlock(node)) {
      return null
    }
    const data = node.data
    if (!data) {
      return (
        <figure
          key={index}
          className='my-6 rounded-lg border border-gray-200 bg-gray-50 p-4'
        >
          <span className='text-sm text-gray-500'>
            {context?.assetUnresolvedLabel}
          </span>
        </figure>
      )
    }
    const { url, alt } = data
    if (url) {
      return (
        <figure
          key={index}
          className='my-6'
        >
          <div className='relative h-80 w-full'>
            <ContentImage
              image={{ url, alt }}
              fill
              className='rounded-lg border border-gray-200 object-contain'
              sizes='(min-width: 1024px) 896px, 100vw'
              preload={context?.imagePreload}
            />
          </div>
        </figure>
      )
    }
    return (
      <figure
        key={index}
        className='my-6 rounded-lg border border-gray-200 bg-gray-50 p-4'
      >
        <span className='text-sm text-gray-500'>
          {context?.assetUnresolvedLabel}
        </span>
      </figure>
    )
  },
}
