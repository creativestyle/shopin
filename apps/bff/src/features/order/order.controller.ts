import {
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Param,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger'
import { SecureRateLimit } from '../../common/throttler/secure-rate-limit.decorator'
import { OrderService } from './order.service'
import {
  CreateOrderRequestSchema,
  OrderResponseSchema,
  OrdersResponseSchema,
} from '@core/contracts/order/order'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import { z } from 'zod'
import { ZodBody, ZodQuery } from '../../common/validation'
import { CartTokenRefreshInterceptor } from '../cart/cart-token-refresh.interceptor'
import { UseCsrfGuard } from '../csrf/csrf.decorator'

const GetOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
})

@Controller('order')
@ApiTags('order')
@UseInterceptors(CartTokenRefreshInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @SecureRateLimit()
  @UseCsrfGuard()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    description: 'Order created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data',
  })
  @ApiConflictResponse({
    description: 'Order already exists for this cart',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async createOrder(
    @ZodBody(CreateOrderRequestSchema) request: CreateOrderRequest
  ): Promise<OrderResponse> {
    const order = await this.orderService.createOrder(request)
    return OrderResponseSchema.parse(order)
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Orders retrieved successfully',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getOrders(
    @ZodQuery(GetOrdersQuerySchema) query: GetOrdersRequest
  ): Promise<OrdersResponse> {
    const orders = await this.orderService.getOrders(query)
    return OrdersResponseSchema.parse(orders)
  }

  @Get(':orderId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Order retrieved successfully',
  })
  @ApiNotFoundResponse({
    description: 'Order not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getOrder(@Param('orderId') orderId: string): Promise<OrderResponse> {
    const order = await this.orderService.getOrder(orderId)
    return OrderResponseSchema.parse(order)
  }
}
