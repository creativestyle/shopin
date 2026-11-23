import {
  PageService,
  PageBySlugQuery,
  AssetsByIdQuery,
  EntriesByIdQuery,
} from '@integrations/contentful-api'

type Node = Record<string, unknown>

function text(value: string): Node {
  return { nodeType: 'text', value, marks: [], data: {} }
}

function paragraph(...content: Node[]): Node {
  return { nodeType: 'paragraph', data: {}, content }
}

function doc(...content: Node[]): Node {
  return { nodeType: 'document', data: {}, content }
}

function entryLink(id: string, label: string): Node {
  return {
    nodeType: 'entry-hyperlink',
    data: { target: { sys: { id, type: 'Link', linkType: 'Entry' } } },
    content: [text(label)],
  }
}

function uriLink(uri: string, label: string): Node {
  return { nodeType: 'hyperlink', data: { uri }, content: [text(label)] }
}

function embeddedAsset(id: string): Node {
  return {
    nodeType: 'embedded-asset-block',
    data: { target: { sys: { id, type: 'Link', linkType: 'Asset' } } },
    content: [],
  }
}

function richTextTeaser(json: Node) {
  return { __typename: 'TeaserRichText', richText: { json } }
}

function accordionTeaser(json: Node) {
  return {
    __typename: 'TeaserAccordion',
    accordion: {
      mode: 'single',
      itemsCollection: {
        items: [{ title: 'Details', expanded: false, body: { json } }],
      },
    },
  }
}

const ENTRIES = [
  { __typename: 'Page', sys: { id: 'page-about' }, slug: 'about' },
  {
    __typename: 'Link',
    sys: { id: 'link-docs' },
    url: 'https://example.com/docs',
  },
  {
    __typename: 'Link',
    sys: { id: 'link-unsafe' },
    url: 'javascript:alert(1)',
  },
]

const ASSETS = [
  {
    sys: { id: 'asset-1' },
    url: 'https://images.ctfassets.net/space/asset-1/photo.jpg',
    title: 'Photo',
  },
]

function createService(
  components: unknown[],
  overrides: { entries?: () => Promise<unknown> } = {}
) {
  const page = {
    pageCollection: {
      items: [
        {
          slug: 'home',
          title: 'Home',
          componentsCollection: { items: components },
        },
      ],
    },
  }
  const request = jest.fn((query: unknown) => {
    if (query === PageBySlugQuery) {
      return Promise.resolve(page)
    }
    if (query === AssetsByIdQuery) {
      return Promise.resolve({ assetCollection: { items: ASSETS } })
    }
    if (query === EntriesByIdQuery) {
      return overrides.entries
        ? overrides.entries()
        : Promise.resolve({ entryCollection: { items: ENTRIES } })
    }
    return Promise.reject(new Error('Unexpected query'))
  })
  const logger = { setContext: jest.fn(), warn: jest.fn() }
  const service = new PageService({ request } as never, logger as never)
  return { service, request, logger }
}

// Inline nodes of the first paragraph of a rich text teaser
async function getInlineNodes(
  service: PageService,
  index = 0
): Promise<Node[]> {
  const page = await service.getPage('home', 'en-US')
  const teaser = page.components[index] as {
    richText?: { content?: Array<{ content?: Node[] }> }
  }
  return teaser.richText?.content?.[0]?.content ?? []
}

describe('ContentfulPageService rich text links', () => {
  it('links a Page entry to its slug', async () => {
    const { service } = createService([
      richTextTeaser(doc(paragraph(entryLink('page-about', 'About us')))),
    ])

    const [link] = await getInlineNodes(service)

    expect(link).toMatchObject({
      nodeType: 'hyperlink',
      data: { label: 'About us', url: '/about' },
    })
    expect(link?.data).not.toHaveProperty('target')
  })

  it('links a Link entry to its url', async () => {
    const { service } = createService([
      richTextTeaser(doc(paragraph(entryLink('link-docs', 'Docs')))),
    ])

    const [link] = await getInlineNodes(service)

    expect(link).toMatchObject({
      nodeType: 'hyperlink',
      data: { label: 'Docs', url: 'https://example.com/docs' },
    })
  })

  it('turns an unresolved entry link into a hyperlink without url', async () => {
    const { service } = createService([
      richTextTeaser(doc(paragraph(entryLink('unpublished', 'Gone')))),
    ])

    const [link] = await getInlineNodes(service)

    expect(link).toEqual({
      nodeType: 'hyperlink',
      data: { label: 'Gone' },
      content: [text('Gone')],
    })
  })

  it('maps a uri hyperlink to url', async () => {
    const { service } = createService([
      richTextTeaser(
        doc(paragraph(uriLink('mailto:shop@example.com', 'Mail us')))
      ),
    ])

    const [link] = await getInlineNodes(service)

    expect(link).toEqual({
      nodeType: 'hyperlink',
      data: { label: 'Mail us', url: 'mailto:shop@example.com' },
      content: [text('Mail us')],
    })
  })

  it.each([
    ['javascript: uri', uriLink('javascript:alert(1)', 'Click')],
    ['data: uri', uriLink('data:text/html,<script>1</script>', 'Click')],
    ['backslash path', uriLink('/\\evil.example', 'Click')],
    ['unsafe Link entry url', entryLink('link-unsafe', 'Click')],
  ])('drops the url of a %s', async (_, node) => {
    const { service } = createService([richTextTeaser(doc(paragraph(node)))])

    const [link] = await getInlineNodes(service)

    expect(link).toMatchObject({
      nodeType: 'hyperlink',
      data: { label: 'Click' },
    })
    expect(link?.data).not.toHaveProperty('url')
  })

  it('resolves an embedded asset and an entry link in an accordion body', async () => {
    const { service } = createService([
      accordionTeaser(
        doc(
          embeddedAsset('asset-1'),
          paragraph(entryLink('page-about', 'About'))
        )
      ),
    ])

    const page = await service.getPage('home', 'en-US')

    expect(page.components).toHaveLength(1)
    const accordion = page.components[0] as {
      items: Array<{ body?: { content?: Node[] } }>
    }
    const [asset, para] = accordion.items[0]?.body?.content ?? []
    expect(asset).toMatchObject({
      nodeType: 'embedded-asset-block',
      data: { url: ASSETS[0]?.url, alt: 'Photo' },
    })
    expect((para?.content as Node[])[0]).toMatchObject({
      nodeType: 'hyperlink',
      data: { label: 'About', url: '/about' },
    })
  })

  it('still resolves assets when the entries query fails', async () => {
    const { service, logger } = createService(
      [
        richTextTeaser(
          doc(
            embeddedAsset('asset-1'),
            paragraph(entryLink('page-about', 'About'))
          )
        ),
      ],
      { entries: () => Promise.reject(new Error('entries down')) }
    )

    const page = await service.getPage('home', 'en-US')

    const teaser = page.components[0] as { richText?: { content?: Node[] } }
    const [asset, para] = teaser.richText?.content ?? []
    expect(asset).toMatchObject({ data: { url: ASSETS[0]?.url } })
    expect((para?.content as Node[])[0]).toEqual({
      nodeType: 'hyperlink',
      data: { label: 'About' },
      content: [text('About')],
    })
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'entryCollection' }),
      expect.any(String)
    )
  })

  it('makes no link queries when the rich text has no links', async () => {
    const { service, request } = createService([
      richTextTeaser(doc(paragraph(text('Plain')))),
    ])

    await service.getPage('home', 'en-US')

    expect(request).toHaveBeenCalledTimes(1)
  })
})
