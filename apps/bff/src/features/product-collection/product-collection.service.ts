import { Injectable } from '@nestjs/common'
import type {
  ProductCollectionPageResponse,
  Filters,
} from '@core/contracts/product-collection/product-collection-page'
import { DataSourceFactory } from '../../data-source/data-source.factory'
import { DEFAULT_SORT_OPTION, type SortOption } from '@config/constants'

@Injectable()
export class ProductCollectionService {
  constructor(private readonly dataSourceFactory: DataSourceFactory) {}

  async getProductCollectionPage(
    productCollectionSlug: string,
    page: number,
    limit: number,
    sort: SortOption = DEFAULT_SORT_OPTION,
    filters?: Filters,
    saleOnly: boolean = false,
    priceMin?: number,
    priceMax?: number
  ): Promise<ProductCollectionPageResponse> {
    const { productCollectionService } = this.dataSourceFactory.getServices()
    const response = await productCollectionService.getProductCollection(
      productCollectionSlug,
      page,
      limit,
      sort,
      filters,
      saleOnly,
      priceMin,
      priceMax
    )

    return {
      breadcrumb: response.breadcrumb,
      productList: response.productList,
      total: response.total,
      facets: response.facets,
      priceRange: response.priceRange,
      categoryTree: response.categoryTree,
      currentCategoryId: response.currentCategoryId,
    }
  }
}
