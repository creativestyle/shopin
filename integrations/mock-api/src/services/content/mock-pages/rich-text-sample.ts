/**
 * Rich text document matching Contentful migration "all possibilities" (en-US).
 * Same structure and copy as richTextWithAllPossibilities() in
 * integrations/contentful-migration/migrations/02-01-demo-content/shared/rich-text.ts
 * including headings 1–6, all marks (bold, italic, underline, code), lists, blockquote,
 * hr, table, external hyperlink, asset hyperlink, and embedded-asset-block.
 */
import type { RichTextDocumentResponse } from '@core/contracts/content/rich-text-document'

export const whyShopWithUsRichText: RichTextDocumentResponse = {
  nodeType: 'document',
  data: {},
  content: [
    {
      nodeType: 'heading-1',
      data: {},
      content: [
        {
          nodeType: 'text',
          value: 'Rich text: all possibilities',
          data: {},
          marks: [],
        },
      ],
    },
    {
      nodeType: 'heading-2',
      data: {},
      content: [{ nodeType: 'text', value: 'Headings', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-3',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 3', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-4',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 4', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-5',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 5', data: {}, marks: [] }],
    },
    {
      nodeType: 'heading-6',
      data: {},
      content: [{ nodeType: 'text', value: 'Heading 6', data: {}, marks: [] }],
    },
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: 'Marks: ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'bold',
          data: {},
          marks: [{ type: 'bold' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'italic',
          data: {},
          marks: [{ type: 'italic' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'underline',
          data: {},
          marks: [{ type: 'underline' }],
        },
        { nodeType: 'text', value: ', ', data: {}, marks: [] },
        {
          nodeType: 'text',
          value: 'code',
          data: {},
          marks: [{ type: 'code' }],
        },
        { nodeType: 'text', value: '.', data: {}, marks: [] },
      ],
    },
    {
      nodeType: 'unordered-list',
      data: {},
      content: [
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'Unordered item A',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'Unordered item B',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: 'ordered-list',
      data: {},
      content: [
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'First step',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'list-item',
          data: {},
          content: [
            {
              nodeType: 'paragraph',
              data: {},
              content: [
                {
                  nodeType: 'text',
                  value: 'Second step',
                  data: {},
                  marks: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: 'blockquote',
      data: {},
      content: [
        {
          nodeType: 'paragraph',
          data: {},
          content: [
            {
              nodeType: 'text',
              value:
                'This is a blockquote. Quality and style – shop with confidence.',
              data: {},
              marks: [],
            },
          ],
        },
      ],
    },
    { nodeType: 'hr', data: {}, content: [] },
    {
      nodeType: 'table',
      data: {},
      content: [
        {
          nodeType: 'table-row',
          data: {},
          content: [
            {
              nodeType: 'table-header-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Column A',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
            {
              nodeType: 'table-header-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Column B',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'table-row',
          data: {},
          content: [
            {
              nodeType: 'table-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Cell 1',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
            {
              nodeType: 'table-cell',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  data: {},
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Cell 2',
                      data: {},
                      marks: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: 'External link: ', data: {}, marks: [] },
        {
          nodeType: 'hyperlink',
          data: {
            label: 'creativestyle.com',
            url: 'https://creativestyle.com/',
          },
          content: [
            {
              nodeType: 'text',
              value: 'creativestyle.com',
              data: {},
              marks: [],
            },
          ],
        },
        { nodeType: 'text', value: '.', data: {}, marks: [] },
      ],
    },
    {
      nodeType: 'paragraph',
      data: {},
      content: [
        { nodeType: 'text', value: 'Link to asset: ', data: {}, marks: [] },
        {
          nodeType: 'hyperlink',
          data: {
            label: 'image',
            url: 'https://placehold.co/600x400/f3f4f6/6b7280?text=Image',
          },
          content: [
            {
              nodeType: 'text',
              value: 'image',
              data: {},
              marks: [],
            },
          ],
        },
        { nodeType: 'text', value: '.', data: {}, marks: [] },
      ],
    },
    {
      nodeType: 'embedded-asset-block',
      data: {
        url: 'https://placehold.co/600x400/f3f4f6/6b7280?text=Image',
        alt: 'Example asset image',
      },
      content: [],
    },
  ],
}
