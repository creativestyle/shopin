import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger'
import { ProductSearchService } from './product-search.service'
import {
  ProductSearchQuerySchema,
  ProductSearchResponseSchema,
  type ProductSearchResponse,
} from '@core/contracts/product-search/product-search'
import {
  FiltersSchema,
  SaleOnlySchema,
  PriceMinSchema,
  PriceMaxSchema,
  SortSchema,
  PageSchema,
  LimitSchema as CollectionLimitSchema,
} from '@core/contracts/product-collection/product-collection-page'
import { ZodQuery } from '../../common/validation'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'

@Controller('productSearch')
@ApiTags('productSearch')
export class ProductSearchController {
  constructor(private readonly productSearchService: ProductSearchService) {}

  @Get()
  @ApiOkResponse({ description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'filters', required: false, type: String })
  @ApiQuery({ name: 'priceMin', required: false, type: Number })
  @ApiQuery({ name: 'priceMax', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'saleOnly', required: false, type: Boolean })
  async search(
    @ZodQuery(ProductSearchQuerySchema, 'query') query: string,
    @ZodQuery(CollectionLimitSchema, 'limit') limit: number,
    @ZodQuery(PageSchema, 'page') page: number,
    @ZodQuery(FiltersSchema, 'filters') filters: Filters,
    @ZodQuery(PriceMinSchema, 'priceMin') priceMin: number | undefined,
    @ZodQuery(PriceMaxSchema, 'priceMax') priceMax: number | undefined,
    @ZodQuery(SortSchema, 'sort') sort: string,
    @ZodQuery(SaleOnlySchema, 'saleOnly') saleOnly: boolean
  ): Promise<ProductSearchResponse> {
    return ProductSearchResponseSchema.strip().parse(
      await this.productSearchService.searchProducts({
        query,
        limit,
        page,
        filters: filters ?? undefined,
        priceMin,
        priceMax,
        sort,
        saleOnly,
      })
    )
  }
}
