import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOkResponse, ApiQuery } from '@nestjs/swagger'
import { ProductSearchService } from './product-search.service'
import {
  ProductSearchQuerySchema,
  ProductSearchResponseSchema,
  type ProductSearchResponse,
} from '@core/contracts/product-search/product-search'
import { ZodQuery } from '../../common/validation'
import { z } from 'zod'

const LimitSchema = z.coerce.number().int().min(1).max(100).optional().default(4)

@Controller('productSearch')
@ApiTags('productSearch')
export class ProductSearchController {
  constructor(private readonly productSearchService: ProductSearchService) {}

  @Get()
  @ApiOkResponse({ description: 'Search results retrieved successfully' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @ZodQuery(ProductSearchQuerySchema, 'query') query: string,
    @ZodQuery(LimitSchema, 'limit') limit: number
  ): Promise<ProductSearchResponse> {
    return ProductSearchResponseSchema.strip().parse(
      await this.productSearchService.searchProducts(query, limit)
    )
  }
}
