import { ContentPageResponseSchema } from '@core/contracts/content/page'
import {
  FooterResponseSchema,
  HeaderResponseSchema,
} from '@core/contracts/content/layout'
import { LayoutService, PageService } from '..'

describe('mock CMS', () => {
  it.each(['homepage', 'about', 'support'])(
    'serves the %s page as a valid content page',
    async (slug) => {
      const page = await new PageService().getPage(slug)
      expect(() => ContentPageResponseSchema.parse(page)).not.toThrow()
    }
  )

  it('serves a default content page for any other slug', async () => {
    const page = await new PageService().getPage('any-other-page')
    expect(() => ContentPageResponseSchema.parse(page)).not.toThrow()
  })

  it('serves a valid header and footer', async () => {
    const layout = new LayoutService()
    const header = await layout.getHeader()
    const footer = await layout.getFooter()
    expect(() => HeaderResponseSchema.parse(header)).not.toThrow()
    expect(() => FooterResponseSchema.parse(footer)).not.toThrow()
  })
})
