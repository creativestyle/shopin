import { Injectable, Module } from '@nestjs/common'
import { LayoutService } from './services/layout.service'
import { PageService } from './services/page.service'

/** The mock CMS's services, as the BFF's data-source wiring reads them. */
@Injectable()
export class MockCmsServiceProvider {
  constructor(
    private readonly pageService: PageService,
    private readonly layoutService: LayoutService
  ) {}

  getServices() {
    return { pageService: this.pageService, layoutService: this.layoutService }
  }
}

@Module({
  providers: [
    PageService,
    LayoutService,
    {
      provide: 'MOCK_CMS_SERVICE_PROVIDER',
      useClass: MockCmsServiceProvider,
    },
  ],
  exports: [PageService, LayoutService, 'MOCK_CMS_SERVICE_PROVIDER'],
})
export class MockCmsModule {}
