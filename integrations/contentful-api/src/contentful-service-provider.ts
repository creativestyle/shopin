import { Injectable } from '@nestjs/common'
import type { ContentfulServiceProvider } from './interfaces'
import { PageService, LayoutService } from './services'

@Injectable()
export class ContentfulServiceProviderImpl implements ContentfulServiceProvider {
  constructor(
    private readonly pageService: PageService,
    private readonly layoutService: LayoutService
  ) {}

  getServices() {
    return {
      pageService: this.pageService,
      layoutService: this.layoutService,
    }
  }
}
