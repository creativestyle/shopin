import { port } from '@core/integration-kit'
import { PageService } from '../services/page.service'
import { LayoutService } from '../services/layout.service'

/** Mock CMS: pages, header and footer from in-code fixtures. Product carousels name a category slug. */
export default port('cms', {
  providers: [PageService, LayoutService],
  inject: [PageService, LayoutService],
  useFactory: (pageService: PageService, layoutService: LayoutService) => ({
    pageService,
    layoutService,
  }),
})
