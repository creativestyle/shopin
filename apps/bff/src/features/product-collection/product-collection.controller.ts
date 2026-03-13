import { Controller, Get } from '@nestjs/common'
import { ProductCollectionService } from './product-collection.service'
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger'
import {
  ProductCollectionPageResponse,
  ProductCollectionPageResponseSchema,
  ProductCollectionSlugSchema,
  PageSchema,
  LimitSchema,
  SortSchema,
  FiltersSchema,
  SaleOnlySchema,
  PriceMinSchema,
  PriceMaxSchema,
  type Filters,
} from '@core/contracts/product-collection/product-collection-page'
import { ZodParam, ZodQuery } from '../../common/validation'
import {
  MIN_PAGE,
  MIN_ITEMS_PER_PAGE,
  MAX_ITEMS_PER_PAGE,
  VALID_SORT_OPTIONS,
  type SortOption,
} from '@config/constants'

@Controller('productCollection')
@ApiTags('productCollection')
export class ProductCollectionController {
  constructor(
    private readonly productCollectionService: ProductCollectionService
  ) {}

  @Get('slug/:productCollectionSlug/page')
  @ApiOkResponse({
    description: 'Product collection page data retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Category not found',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: `Page number (${MIN_PAGE}-indexed)`,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: `Items per page (${MIN_ITEMS_PER_PAGE}-${MAX_ITEMS_PER_PAGE})`,
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: `Sort option (${VALID_SORT_OPTIONS.join(', ')})`,
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description:
      'JSON-encoded filters object: {"attributeName": ["value1", "value2"]}',
  })
  @ApiQuery({
    name: 'saleOnly',
    required: false,
    type: Boolean,
    description: 'When true, only show discounted products',
  })
  @ApiQuery({
    name: 'priceMin',
    required: false,
    type: Number,
    description: 'Minimum price filter in cents',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    type: Number,
    description: 'Maximum price filter in cents',
  })
  async getProductCollectionPage(
    @ZodParam(ProductCollectionSlugSchema, 'productCollectionSlug')
    productCollectionSlug: string,
    @ZodQuery(PageSchema, 'page') page: number,
    @ZodQuery(LimitSchema, 'limit') limit: number,
    @ZodQuery(SortSchema, 'sort') sort: SortOption,
    @ZodQuery(FiltersSchema, 'filters') filters: Filters,
    @ZodQuery(SaleOnlySchema, 'saleOnly') saleOnly: boolean,
    @ZodQuery(PriceMinSchema, 'priceMin') priceMin: number | undefined,
    @ZodQuery(PriceMaxSchema, 'priceMax') priceMax: number | undefined
  ): Promise<ProductCollectionPageResponse> {
    return ProductCollectionPageResponseSchema.strip().parse(
      await this.productCollectionService.getProductCollectionPage(
        productCollectionSlug,
        page,
        limit,
        sort,
        filters,
        saleOnly,
        priceMin,
        priceMax
      )
    )
  }
}
