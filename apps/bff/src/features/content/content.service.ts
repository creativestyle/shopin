import { Injectable, Inject, Scope, Logger } from '@nestjs/common'
import type { ContentPageResponse } from '@core/contracts/content/page'
import type { TeaserResponse } from '@core/contracts/content/teaser'
import type { ProductCarouselTeaser } from '@core/contracts/content/teaser-product-carousel'
import type { ProductCardResponse } from '@core/contracts/product-collection/product-card'
import type {
  HeaderResponse,
  FooterResponse,
} from '@core/contracts/content/layout'
import { LANGUAGE_TOKEN } from '@core/i18n'
import { PRODUCT_CAROUSEL_PAGE_SIZE } from '@config/constants'
import type { LanguageProvider } from '../../common/language/language.provider'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { ProductCollectionService } from '../product-collection/product-collection.service'

@Injectable({ scope: Scope.REQUEST })
export class ContentService {
  private readonly logger = new Logger(ContentService.name)

  constructor(
    private readonly dataSourceFactory: DataSourceFactory,
    private readonly productCollectionService: ProductCollectionService,
    @Inject(LANGUAGE_TOKEN) private readonly languageProvider: LanguageProvider
  ) {}

  async getContentPage(
    slug: string,
    preview: boolean
  ): Promise<ContentPageResponse> {
    const { pageService } = this.dataSourceFactory.getServices()
    const locale = this.languageProvider.getCurrentLanguage()
    const page = await pageService.getPage(slug, locale, preview)
    const enrichedComponents = await this.enrichProductCarouselTeasers(
      page.components ?? []
    )
    return {
      ...page,
      components: enrichedComponents,
    }
  }

  /**
   * Resolves product data for productCarousel components in the BFF so the frontend does not call product APIs.
   * Fetches all product carousels concurrently to reduce latency.
   */
  private async enrichProductCarouselTeasers(
    components: TeaserResponse[]
  ): Promise<TeaserResponse[]> {
    return Promise.all(
      components.map(async (teaser) => {
        if (teaser.type !== 'productCarousel') {
          return teaser
        }
        const products = await this.resolveProductsForProductCarousel(teaser)
        return { ...teaser, products }
      })
    )
  }

  private async resolveProductsForProductCarousel(
    teaser: ProductCarouselTeaser
  ): Promise<ProductCardResponse[]> {
    const categorySlug = teaser.categorySlug?.trim()
    if (!categorySlug) {
      return []
    }
    try {
      const collection =
        await this.productCollectionService.getProductCollectionPage(
          categorySlug,
          1,
          PRODUCT_CAROUSEL_PAGE_SIZE
        )
      return collection.productList ?? []
    } catch (error) {
      this.logger.warn(
        { err: error, categorySlug },
        'Product collection fetch failed for product carousel; returning empty list'
      )
      return []
    }
  }

  private getLayoutContext() {
    const { layoutService } = this.dataSourceFactory.getServices()
    const locale = this.languageProvider.getCurrentLanguage()
    return { layoutService, locale }
  }

  async getHeader(preview: boolean): Promise<HeaderResponse | null> {
    const { layoutService, locale } = this.getLayoutContext()
    return layoutService.getHeader(locale, preview)
  }

  async getFooter(preview: boolean): Promise<FooterResponse | null> {
    const { layoutService, locale } = this.getLayoutContext()
    return layoutService.getFooter(locale, preview)
  }
}
