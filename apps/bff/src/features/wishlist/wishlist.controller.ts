import {
  Controller,
  Get,
  Post,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger'
import { WishlistService } from './wishlist.service'
import {
  AddToWishlistRequestSchema,
  RemoveFromWishlistRequestSchema,
} from '@core/contracts/wishlist/wishlist'
import type {
  WishlistResponse,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
} from '@core/contracts/wishlist/wishlist'
import { ZodBody } from '../../common/validation'
import { TokenRefreshInterceptor } from '../../common/token-management/token-refresh.interceptor'
import { UseCsrfGuard } from '../csrf/csrf.decorator'
import { Reads } from '@core/integration-kit'
import { Contracts } from '../../data-source/contracts'

@Reads('commerce')
@Controller('wishlist')
@ApiTags('wishlist')
// an expired token is renewed here too, as on cart, order and customer (a 401 otherwise ends the wishlist call)
@UseInterceptors(TokenRefreshInterceptor)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Wishlist retrieved successfully or null if no wishlist exists',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getWishlist(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number
  ): Promise<WishlistResponse | null> {
    const wishlist = await this.wishlistService.getWishlist(page, limit)
    if (!wishlist) {
      return null
    }
    return Contracts.wishlist.parse(wishlist)
  }

  @Post('items')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Item added to wishlist successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async addToWishlist(
    @ZodBody(AddToWishlistRequestSchema) request: AddToWishlistRequest
  ): Promise<WishlistResponse> {
    return Contracts.wishlist.parse(
      await this.wishlistService.addToWishlist(request)
    )
  }

  @Delete('items')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Item removed from wishlist successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async removeFromWishlist(
    @ZodBody(RemoveFromWishlistRequestSchema) request: RemoveFromWishlistRequest
  ): Promise<WishlistResponse> {
    return Contracts.wishlist.parse(
      await this.wishlistService.removeFromWishlist(request)
    )
  }
}
