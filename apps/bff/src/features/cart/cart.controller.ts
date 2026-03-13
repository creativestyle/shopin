import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger'
import { CartService } from './cart.service'
import {
  AddToCartRequestSchema,
  UpdateCartItemRequestSchema,
  RemoveCartItemRequestSchema,
  SetBillingAddressRequestSchema,
  SetShippingAddressRequestSchema,
  CartResponseSchema,
} from '@core/contracts/cart/cart'
import {
  ShippingMethodsResponseSchema,
  SetShippingMethodRequestSchema,
} from '@core/contracts/cart/shipping-method'
import type {
  CartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  RemoveCartItemRequest,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
} from '@core/contracts/cart/cart'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import { ZodBody } from '../../common/validation'
import { CartTokenRefreshInterceptor } from './cart-token-refresh.interceptor'
import { UseCsrfGuard } from '../csrf/csrf.decorator'

@Controller('cart')
@ApiTags('cart')
@UseInterceptors(CartTokenRefreshInterceptor)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Cart retrieved successfully or null if no cart exists',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getCart(): Promise<CartResponse | null> {
    const cart = await this.cartService.getCart()
    if (!cart) {
      return null
    }
    return CartResponseSchema.strip().parse(cart)
  }

  @Post('items')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Item added to cart successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async addToCart(
    @ZodBody(AddToCartRequestSchema) request: AddToCartRequest
  ): Promise<CartResponse> {
    return CartResponseSchema.strip().parse(
      await this.cartService.addToCart(request)
    )
  }

  @Put('items')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Cart item updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async updateCartItem(
    @ZodBody(UpdateCartItemRequestSchema) request: UpdateCartItemRequest
  ): Promise<CartResponse> {
    return CartResponseSchema.strip().parse(
      await this.cartService.updateCartItem(request)
    )
  }

  @Delete('items')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Cart item removed successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async removeCartItem(
    @ZodBody(RemoveCartItemRequestSchema) request: RemoveCartItemRequest
  ): Promise<CartResponse> {
    return CartResponseSchema.strip().parse(
      await this.cartService.removeCartItem(request)
    )
  }

  @Put('billing-address')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Billing address set successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async setBillingAddress(
    @ZodBody(SetBillingAddressRequestSchema) request: SetBillingAddressRequest
  ): Promise<CartResponse> {
    return CartResponseSchema.strip().parse(
      await this.cartService.setBillingAddress(request)
    )
  }

  @Put('shipping-address')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Shipping address set successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async setShippingAddress(
    @ZodBody(SetShippingAddressRequestSchema) request: SetShippingAddressRequest
  ): Promise<CartResponse> {
    return CartResponseSchema.strip().parse(
      await this.cartService.setShippingAddress(request)
    )
  }

  @Get('shipping-methods')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Shipping methods retrieved successfully',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getShippingMethods(): Promise<ShippingMethodsResponse> {
    return ShippingMethodsResponseSchema.parse(
      await this.cartService.getShippingMethods()
    )
  }

  @Put('shipping-method')
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Shipping method set successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async setShippingMethod(
    @ZodBody(SetShippingMethodRequestSchema) request: SetShippingMethodRequest
  ): Promise<CartResponse> {
    const cart = await this.cartService.setShippingMethod(request)
    return CartResponseSchema.strip().parse(cart)
  }

  @Delete()
  @UseCsrfGuard()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponse({
    description: 'Cart ID cleared successfully',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async clearCartId(): Promise<void> {
    await this.cartService.clearCartId()
  }
}
