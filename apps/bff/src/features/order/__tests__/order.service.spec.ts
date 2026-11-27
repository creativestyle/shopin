import { ConflictException, NotFoundException } from '@nestjs/common'
import { OrderService } from '../order.service'

const OWN_CART_ID = 'own-cart'

describe('OrderService.createOrder', () => {
  let dataSourceOrderService: { createOrder: jest.Mock }
  let cartIdService: {
    getGuestCartId: jest.Mock
    getLoggedInCartId: jest.Mock
    deleteGuestCartId: jest.Mock
    deleteLoggedInCartId: jest.Mock
  }
  let tokenProvider: { getAuthStatus: jest.Mock }
  let service: OrderService

  beforeEach(() => {
    dataSourceOrderService = { createOrder: jest.fn() }
    cartIdService = {
      getGuestCartId: jest.fn().mockResolvedValue(OWN_CART_ID),
      getLoggedInCartId: jest.fn().mockResolvedValue(undefined),
      deleteGuestCartId: jest.fn(),
      deleteLoggedInCartId: jest.fn(),
    }
    tokenProvider = { getAuthStatus: jest.fn().mockResolvedValue(false) }
    const services = { orderService: dataSourceOrderService }
    const session = { setGuestOrder: jest.fn(), guestOrder: jest.fn() }

    service = new OrderService(
      services as never,
      cartIdService as never,
      tokenProvider as never,
      session as never
    )
  })

  it('creates an order for the cart in the caller’s cookie and clears it', async () => {
    const order = { id: 'order-1' }
    dataSourceOrderService.createOrder.mockResolvedValue(order)

    await expect(service.createOrder({ cartId: OWN_CART_ID })).resolves.toBe(
      order
    )
    expect(dataSourceOrderService.createOrder).toHaveBeenCalledWith({
      cartId: OWN_CART_ID,
    })
    expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
  })

  it('rejects a cart id that is not in the caller’s cookie with 404', async () => {
    await expect(
      service.createOrder({ cartId: 'someone-elses-cart' })
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(dataSourceOrderService.createOrder).not.toHaveBeenCalled()
    expect(cartIdService.deleteGuestCartId).not.toHaveBeenCalled()
  })

  it('rejects any cart id when the caller has no cart cookie', async () => {
    cartIdService.getGuestCartId.mockResolvedValue(undefined)

    await expect(
      service.createOrder({ cartId: OWN_CART_ID })
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(dataSourceOrderService.createOrder).not.toHaveBeenCalled()
  })

  it('checks the logged-in cookie for a signed-in shopper', async () => {
    tokenProvider.getAuthStatus.mockResolvedValue(true)
    cartIdService.getLoggedInCartId.mockResolvedValue(OWN_CART_ID)
    cartIdService.getGuestCartId.mockResolvedValue(undefined)
    dataSourceOrderService.createOrder.mockResolvedValue({ id: 'order-1' })

    await service.createOrder({ cartId: OWN_CART_ID })

    expect(dataSourceOrderService.createOrder).toHaveBeenCalledTimes(1)
    expect(cartIdService.deleteLoggedInCartId).toHaveBeenCalledTimes(1)
  })

  it('clears the cart cookie and rethrows when the order already exists', async () => {
    const conflict = new ConflictException('Order already exists for this cart')
    dataSourceOrderService.createOrder.mockRejectedValue(conflict)

    await expect(service.createOrder({ cartId: OWN_CART_ID })).rejects.toBe(
      conflict
    )
    expect(cartIdService.deleteGuestCartId).toHaveBeenCalledTimes(1)
  })
})
