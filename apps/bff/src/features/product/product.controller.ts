import { Controller, Get } from '@nestjs/common'
import { ProductService } from './product.service'
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger'
import {
  ProductPageResponse,
  ProductPageResponseSchema,
  ProductSlugSchema,
  VariantIdSchema,
} from '@core/contracts/product/product-page'
import { ZodParam, ZodQuery } from '../../common/validation'

@Controller('product')
@ApiTags('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('slug/:productSlug/page')
  @ApiOkResponse({
    description: 'Product page data retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Product not found',
  })
  @ApiQuery({
    name: 'variantId',
    required: false,
    type: String,
    description: 'Optional variant id to select variant-specific data',
  })
  async getProductPage(
    @ZodParam(ProductSlugSchema, 'productSlug') productSlug: string,
    @ZodQuery(VariantIdSchema, 'variantId') variantId?: string
  ): Promise<ProductPageResponse> {
    return ProductPageResponseSchema.strip().parse(
      await this.productService.getProductPage(productSlug, variantId)
    )
  }
}
