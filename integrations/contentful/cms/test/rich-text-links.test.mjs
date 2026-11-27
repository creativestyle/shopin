import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { format } from 'node:util'
import cms from '../dist/index.js'

const { PageService, PageBySlugQuery, AssetsByIdQuery, EntriesByIdQuery } = cms

/** Jest's toEqual: a property set to undefined counts as absent (recursively). */
function defined(value) {
  if (Array.isArray(value)) return value.map(defined)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, defined(v)])
  )
}

function assertEqual(actual, expected) {
  assert.deepEqual(defined(actual), defined(expected))
}

function text(value) {
  return { nodeType: 'text', value, marks: [], data: {} }
}

function paragraph(...content) {
  return { nodeType: 'paragraph', data: {}, content }
}

function doc(...content) {
  return { nodeType: 'document', data: {}, content }
}

function entryLink(id, label) {
  return {
    nodeType: 'entry-hyperlink',
    data: { target: { sys: { id, type: 'Link', linkType: 'Entry' } } },
    content: [text(label)],
  }
}

function uriLink(uri, label) {
  return { nodeType: 'hyperlink', data: { uri }, content: [text(label)] }
}

function embeddedAsset(id) {
  return {
    nodeType: 'embedded-asset-block',
    data: { target: { sys: { id, type: 'Link', linkType: 'Asset' } } },
    content: [],
  }
}

function richTextTeaser(json) {
  return { __typename: 'TeaserRichText', richText: { json } }
}

function accordionTeaser(json) {
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

function createService(components, overrides = {}) {
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
  const request = mock.fn((query) => {
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
  const logger = { setContext: mock.fn(), warn: mock.fn() }
  const service = new PageService({ request }, logger)
  return { service, request, logger }
}

// Inline nodes of the first paragraph of a rich text teaser
async function getInlineNodes(service, index = 0) {
  const page = await service.getPage('home', 'en-US')
  const teaser = page.components[index]
  return teaser.richText?.content?.[0]?.content ?? []
}

describe('ContentfulPageService rich text links', () => {
  it('links a Page entry to its slug', async () => {
    const { service } = createService([
      richTextTeaser(doc(paragraph(entryLink('page-about', 'About us')))),
    ])

    const [link] = await getInlineNodes(service)

    assert.equal(link.nodeType, 'hyperlink')
    assert.equal(link.data.label, 'About us')
    assert.equal(link.data.url, '/about')
    assert.ok(!('target' in link.data))
  })

  it('links a Link entry to its url', async () => {
    const { service } = createService([
      richTextTeaser(doc(paragraph(entryLink('link-docs', 'Docs')))),
    ])

    const [link] = await getInlineNodes(service)

    assert.equal(link.nodeType, 'hyperlink')
    assert.equal(link.data.label, 'Docs')
    assert.equal(link.data.url, 'https://example.com/docs')
  })

  it('turns an unresolved entry link into a hyperlink without url', async () => {
    const { service } = createService([
      richTextTeaser(doc(paragraph(entryLink('unpublished', 'Gone')))),
    ])

    const [link] = await getInlineNodes(service)

    assertEqual(link, {
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

    assertEqual(link, {
      nodeType: 'hyperlink',
      data: { label: 'Mail us', url: 'mailto:shop@example.com' },
      content: [text('Mail us')],
    })
  })

  for (const [kind, node] of [
    ['javascript: uri', uriLink('javascript:alert(1)', 'Click')],
    ['data: uri', uriLink('data:text/html,<script>1</script>', 'Click')],
    ['backslash path', uriLink('/\\evil.example', 'Click')],
    ['unsafe Link entry url', entryLink('link-unsafe', 'Click')],
  ]) {
    // the name as Jest's it.each('drops the url of a %s') printed it
    it(format('drops the url of a %s', kind), async () => {
      const { service } = createService([richTextTeaser(doc(paragraph(node)))])

      const [link] = await getInlineNodes(service)

      assert.equal(link.nodeType, 'hyperlink')
      assert.equal(link.data.label, 'Click')
      assert.ok(!('url' in link.data))
    })
  }

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

    assert.equal(page.components.length, 1)
    const accordion = page.components[0]
    const [asset, para] = accordion.items[0]?.body?.content ?? []
    assert.equal(asset.nodeType, 'embedded-asset-block')
    assert.equal(asset.data.url, ASSETS[0]?.url)
    assert.equal(asset.data.alt, 'Photo')
    const paraLink = para?.content[0]
    assert.equal(paraLink.nodeType, 'hyperlink')
    assert.equal(paraLink.data.label, 'About')
    assert.equal(paraLink.data.url, '/about')
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

    const teaser = page.components[0]
    const [asset, para] = teaser.richText?.content ?? []
    assert.equal(asset.data.url, ASSETS[0]?.url)
    assertEqual(para?.content[0], {
      nodeType: 'hyperlink',
      data: { label: 'About' },
      content: [text('About')],
    })
    // toHaveBeenCalledWith(objectContaining({ collection: 'entryCollection' }), any(String))
    assert.ok(
      logger.warn.mock.calls.some(
        ({ arguments: args }) =>
          args.length === 2 &&
          args[0]?.collection === 'entryCollection' &&
          typeof args[1] === 'string'
      )
    )
  })

  it('makes no link queries when the rich text has no links', async () => {
    const { service, request } = createService([
      richTextTeaser(doc(paragraph(text('Plain')))),
    ])

    await service.getPage('home', 'en-US')

    assert.equal(request.mock.callCount(), 1)
  })
})
