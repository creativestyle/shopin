import { ContentPageResponseSchema } from '@core/contracts/content/page'
import {
  FooterResponseSchema,
  HeaderResponseSchema,
} from '@core/contracts/content/layout'
import { LayoutService, PageService } from '..'

describe('mock CMS', () => {
  // a title only the dedicated page has: a slug that fell through to the default page would not show it
  it.each([
    ['homepage', 'Hero slider'],
    ['about', 'Our team'],
    ['support', 'FAQ'],
  ])('serves its own %s page as a valid content page', async (slug, title) => {
    const page = await new PageService().getPage(slug)
    expect(() => ContentPageResponseSchema.parse(page)).not.toThrow()
    expect(JSON.stringify(page)).toContain(`"title":"${title}"`)
  })

  it('serves a default content page for any other slug, under that slug', async () => {
    const page = await new PageService().getPage('any-other-page')
    expect(() => ContentPageResponseSchema.parse(page)).not.toThrow()
    expect(page.slug).toBe('any-other-page')
    expect(JSON.stringify(page)).not.toContain('"title":"Hero slider"')
  })

  it('serves a valid header and footer', async () => {
    const layout = new LayoutService()
    const header = await layout.getHeader()
    const footer = await layout.getFooter()
    expect(() => HeaderResponseSchema.parse(header)).not.toThrow()
    expect(() => FooterResponseSchema.parse(footer)).not.toThrow()
  })
})
