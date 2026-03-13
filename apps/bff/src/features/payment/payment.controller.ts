import {
  Controller,
  Get,
  Post,
  Put,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger'
import { SecureRateLimit } from '../../common/throttler/secure-rate-limit.decorator'
import { PaymentService } from './payment.service'
import {
  PaymentMethodsResponseSchema,
  SetPaymentMethodRequestSchema,
  InitiatePaymentRequestSchema,
} from '@core/contracts/cart/payment-method'
import type {
  PaymentMethodsResponse,
  SetPaymentMethodRequest,
  InitiatePaymentRequest,
} from '@core/contracts/cart/payment-method'
import { CartResponseSchema } from '@core/contracts/cart/cart'
import type { CartResponse } from '@core/contracts/cart/cart'
import { ZodBody } from '../../common/validation'
import { CartTokenRefreshInterceptor } from '../cart/cart-token-refresh.interceptor'
import { UseCsrfGuard } from '../csrf/csrf.decorator'

@Controller('payment')
@ApiTags('payment')
@UseInterceptors(CartTokenRefreshInterceptor)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('methods')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Payment methods retrieved successfully',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getPaymentMethods(): Promise<PaymentMethodsResponse> {
    return PaymentMethodsResponseSchema.parse(
      await this.paymentService.getPaymentMethods()
    )
  }

  @Put('method')
  @SecureRateLimit()
  @UseCsrfGuard()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Payment method set successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async setPaymentMethod(
    @ZodBody(SetPaymentMethodRequestSchema) request: SetPaymentMethodRequest
  ): Promise<CartResponse> {
    const cart = await this.paymentService.setPaymentMethod(request)
    return CartResponseSchema.strip().parse(cart)
  }

  @Post('initiate')
  @SecureRateLimit()
  @UseCsrfGuard()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Payment link generated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async initiatePayment(
    @ZodBody(InitiatePaymentRequestSchema) request: InitiatePaymentRequest
  ): Promise<{ paymentLink: string }> {
    return await this.paymentService.initiatePayment(request.cartId)
  }
}
