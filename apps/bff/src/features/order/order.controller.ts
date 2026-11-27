import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Param,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger'
import { OrderService } from './order.service'
import {
  OrderResponseSchema,
  OrdersResponseSchema,
} from '@core/contracts/order/order'
import type {
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import { z } from 'zod'
import { ZodQuery } from '../../common/validation'
import { CartTokenRefreshInterceptor } from '../cart/cart-token-refresh.interceptor'
import { Reads } from '@core/integration-kit'

const GetOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
})

@Reads('commerce')
@Controller('order')
@ApiTags('order')
@UseInterceptors(CartTokenRefreshInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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
