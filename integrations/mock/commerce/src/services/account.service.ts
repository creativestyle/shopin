import {
  ConflictException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'
import {
  CustomerContext,
  type CustomerRecord,
  type Port,
  type SignedIn,
} from '@core/integration-kit'
import type {
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import type {
  AddAddressRequest,
  AddressesResponse,
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import {
  DEFAULT_ORDER_PAGE_SIZE,
  OrderResponseSchema,
} from '@core/contracts/order/order'
import { cartOwners, cartStore, customerCarts } from './cart.service'

/** In-memory customers of the mock commerce provider. */
interface MockCustomer {
  id: string
  email: string
  firstName?: string
  lastName?: string
  /** `<identity provider>:<subject>` of every identity linked to this customer. */
  externalIds: string[]
  version: number
}

export const customerStore = new Map<string, MockCustomer>()
/** Orders per customer id (`guest` for guest orders). */
export const orderStore = new Map<string, OrderResponse[]>()
/** Cart id → the order made from it: ordering the same cart again is a conflict, as on a real platform. */
export const orderedCarts = new Map<string, string>()

/** Customer lookups and writes for the BFF's linking policy; this part decides nothing. */
@Injectable()
export class MockCustomerStore implements NonNullable<
  Port<'commerce'>['customers']
> {
  private record(c: MockCustomer | undefined): CustomerRecord | undefined {
    // mock customers have no password: every one was created for an external identity
    return (
      c && {
        id: c.id,
        hasPassword: false,
        ...(c.externalIds[0] ? { externalId: c.externalIds[0] } : {}),
      }
    )
  }

  async findByExternalId(
    externalId: string
  ): Promise<CustomerRecord | undefined> {
    return this.record(
      [...customerStore.values()].find((c) =>
        c.externalIds.includes(externalId)
      )
    )
  }

  async findByEmail(email: string): Promise<CustomerRecord | undefined> {
    return this.record(
      [...customerStore.values()].find(
        (c) => c.email.toLowerCase() === email.toLowerCase()
      )
    )
  }

  async setExternalId(customerId: string, externalId: string): Promise<void> {
    const c = customerStore.get(customerId)
    if (!c) {
      throw new NotFoundException('Customer not found')
    }
    c.externalIds.push(externalId)
    c.version++
  }

  async create(identity: SignedIn, externalId: string): Promise<string> {
    const [firstName, ...rest] = (identity.name ?? '').split(' ')
    const created: MockCustomer = {
      id: `mock-customer-${randomUUID()}`,
      email: identity.email,
      ...(firstName ? { firstName } : {}),
      ...(rest.length ? { lastName: rest.join(' ') } : {}),
      externalIds: [externalId],
      version: 1,
    }
    customerStore.set(created.id, created)
    return created.id
  }
}

/** Base: every account call acts for the customer id the BFF took from the SHOPin session. */
abstract class ForCustomer {
  constructor(private readonly context?: CustomerContext) {}

  protected async customerId(): Promise<string> {
    const id = await this.context?.customerId()
    if (!id) {
      throw new UnauthorizedException('Not signed in')
    }
    return id
  }

  protected async customer(): Promise<MockCustomer> {
    const customer = customerStore.get(await this.customerId())
    if (!customer) {
      throw new NotFoundException('Customer not found')
    }
    return customer
  }

  protected async optionalCustomerId(): Promise<string | undefined> {
    return this.context?.customerId()
  }
}

@Injectable()
export class MockCustomerService extends ForCustomer {
  constructor(@Optional() context?: CustomerContext) {
    super(context)
  }

  async getCurrentCustomer(): Promise<CustomerResponse> {
    const c = await this.customer()
    return {
      id: c.id,
      email: c.email,
      version: c.version,
      isEmailVerified: true,
      ...(c.firstName ? { firstName: c.firstName } : {}),
      ...(c.lastName ? { lastName: c.lastName } : {}),
    }
  }

  async updateCustomer(
    request: UpdateCustomerRequest
  ): Promise<CustomerResponse> {
    const c = await this.customer()
    c.firstName = request.firstName
    c.lastName = request.lastName
    c.version++
    return this.getCurrentCustomer()
  }

  async changeCustomerPassword(): Promise<void> {
    throw new NotImplementedException(
      'Passwords belong to the identity provider'
    )
  }

  async changeCustomerEmail(): Promise<CustomerResponse> {
    throw new NotImplementedException(
      'The sign-in email belongs to the identity provider'
    )
  }
}

/** The address book of each mock customer, by customer id: in memory, like everything else in the mock. */
interface AddressBook {
  addresses: AddressResponse[]
  defaultShippingAddressId?: string
  defaultBillingAddressId?: string
}
export const addressBooks = new Map<string, AddressBook>()

@Injectable()
export class MockCustomerAddressService extends ForCustomer {
  constructor(@Optional() context?: CustomerContext) {
    super(context)
  }

  private async book(): Promise<AddressBook> {
    const { id } = await this.customer()
    let book = addressBooks.get(id)
    if (!book) {
      book = { addresses: [] }
      addressBooks.set(id, book)
    }
    return book
  }

  private static find(book: AddressBook, addressId: string): AddressResponse {
    const address = book.addresses.find((a) => a.id === addressId)
    if (!address) {
      throw new NotFoundException(`Address not found: ${addressId}`)
    }
    return address
  }

  async getAddresses(): Promise<AddressesResponse> {
    const book = await this.book()
    return {
      addresses: book.addresses.map((a) => ({
        ...a,
        isDefaultShipping: a.id === book.defaultShippingAddressId,
        isDefaultBilling: a.id === book.defaultBillingAddressId,
      })),
      ...(book.defaultShippingAddressId
        ? { defaultShippingAddressId: book.defaultShippingAddressId }
        : {}),
      ...(book.defaultBillingAddressId
        ? { defaultBillingAddressId: book.defaultBillingAddressId }
        : {}),
    }
  }

  async addAddress(request: AddAddressRequest): Promise<AddressResponse> {
    const book = await this.book()
    const { isDefaultShipping, isDefaultBilling, ...fields } = request
    const address: AddressResponse = {
      ...fields,
      id: `mock-address-${randomUUID()}`,
    }
    book.addresses.push(address)
    if (isDefaultShipping) {
      book.defaultShippingAddressId = address.id
    }
    if (isDefaultBilling) {
      book.defaultBillingAddressId = address.id
    }
    return address
  }

  async updateAddress(request: UpdateAddressRequest): Promise<AddressResponse> {
    const book = await this.book()
    const { id, isDefaultShipping, isDefaultBilling, ...fields } = request
    const address = MockCustomerAddressService.find(book, id)
    // a full replacement: a field left out of the request is removed, as in the address form
    for (const key of Object.keys(address)) {
      if (key !== 'id') {
        delete address[key as keyof AddressResponse]
      }
    }
    Object.assign(address, fields)
    if (isDefaultShipping) {
      book.defaultShippingAddressId = id
    }
    if (isDefaultBilling) {
      book.defaultBillingAddressId = id
    }
    return address
  }

  async deleteAddress(addressId: string): Promise<void> {
    const book = await this.book()
    MockCustomerAddressService.find(book, addressId)
    book.addresses = book.addresses.filter((a) => a.id !== addressId)
    if (book.defaultShippingAddressId === addressId) {
      delete book.defaultShippingAddressId
    }
    if (book.defaultBillingAddressId === addressId) {
      delete book.defaultBillingAddressId
    }
  }

  async setDefaultShippingAddress(addressId: string): Promise<void> {
    const book = await this.book()
    book.defaultShippingAddressId = MockCustomerAddressService.find(
      book,
      addressId
    ).id
  }

  async setDefaultBillingAddress(addressId: string): Promise<void> {
    const book = await this.book()
    book.defaultBillingAddressId = MockCustomerAddressService.find(
      book,
      addressId
    ).id
  }
}

@Injectable()
export class MockOrderService extends ForCustomer {
  constructor(@Optional() context?: CustomerContext) {
    super(context)
  }

  async createOrder(request: CreateOrderRequest): Promise<OrderResponse> {
    if (orderedCarts.has(request.cartId)) {
      throw new ConflictException('Order already exists for this cart')
    }
    const cart = cartStore.get(request.cartId)
    const cartOwner = cartOwners.get(request.cartId)
    const customerId = await this.optionalCustomerId()
    if (!cart || (cartOwner !== undefined && cartOwner !== customerId)) {
      throw new NotFoundException(`Cart not found: ${request.cartId}`)
    }
    const owner = customerId ?? 'guest'
    const orders = orderStore.get(owner) ?? []
    // the whole cart, as on main: addresses and discounts reach the order; the schema drops cart-only fields
    const order = OrderResponseSchema.parse({
      ...cart,
      id: `mock-order-${randomUUID()}`,
      version: 1,
      orderNumber: `M-${String(orders.length + 1).padStart(5, '0')}`,
      createdAt: new Date().toISOString(),
      orderState: 'Open',
      email:
        owner !== 'guest'
          ? customerStore.get(owner)?.email
          : cart.billingAddress?.email,
    })
    orderStore.set(owner, [order, ...orders])
    orderedCarts.set(cart.id, order.id)
    cartStore.delete(cart.id)
    if (owner !== 'guest') {
      customerCarts.delete(owner)
    }
    return order
  }

  /**
   * A customer's order, or for a guest one of the guest orders: the BFF lets a guest ask only for the order its
   * guest-order cookie names (the order confirmation), so the mock answers that lookup without a customer.
   */
  async getOrder(orderId: string): Promise<OrderResponse> {
    const owner = (await this.optionalCustomerId()) ?? 'guest'
    const order = (orderStore.get(owner) ?? []).find((o) => o.id === orderId)
    if (!order) {
      throw new NotFoundException(`Order not found: ${orderId}`)
    }
    return order
  }

  async getOrders(request?: GetOrdersRequest): Promise<OrdersResponse> {
    const all = orderStore.get(await this.customerId()) ?? []
    const offset = request?.offset ?? 0
    const limit = request?.limit ?? DEFAULT_ORDER_PAGE_SIZE
    return {
      orders: all.slice(offset, offset + limit).map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        orderState: o.orderState,
        grandTotal: o.grandTotal,
        currency: o.currency,
        itemCount: o.itemCount,
        lineItemImages: [],
      })),
      total: all.length,
      offset,
      limit,
    }
  }
}
