import { Injectable } from '@nestjs/common'
import { port } from '@core/integration-kit'
import type { MockOptions } from '../options'
import { withMappers } from '../mappers'
import { MockClientModule } from '../client/client.module'
import { ProductService } from '../services/product.service'
import { ProductCollectionService } from '../services/product-collection.service'
import { ProductSearchService } from '../services/product-search.service'
import { NavigationService } from '../services/navigation.service'
import { CartService } from '../services/cart.service'
import { CartPaymentService } from '../services/cart-payment.service'
import { StoreConfigService } from '../services/store-config.service'
import { WishlistService } from '../services/wishlist.service'
import {
  MockCustomerStore,
  MockCustomerService,
  MockCustomerAddressService,
  MockOrderService,
} from '../services/account.service'

@Injectable()
export class MockCommerce {
  constructor(
    readonly productService: ProductService,
    readonly productCollectionService: ProductCollectionService,
    readonly productSearchService: ProductSearchService,
    readonly navigationService: NavigationService,
    readonly cartService: CartService,
    readonly cartPaymentService: CartPaymentService,
    readonly storeConfigService: StoreConfigService,
    readonly wishlistService: WishlistService,
    readonly customerService: MockCustomerService,
    readonly customerAddressService: MockCustomerAddressService,
    readonly orderService: MockOrderService,
    readonly customers: MockCustomerStore
  ) {}
}

/**
 * Mock commerce: catalog, carts, wishlist, customers linked from any identity provider, orders. With the shop's
 * mapper hooks (`mock({ mappers })`) applied after the built-in mapping.
 */
export const commercePort = (options: MockOptions = {}) =>
  port('commerce', {
    imports: [MockClientModule],
    providers: [
      ProductService,
      ProductCollectionService,
      ProductSearchService,
      NavigationService,
      CartService,
      CartPaymentService,
      StoreConfigService,
      WishlistService,
      MockCustomerService,
      MockCustomerAddressService,
      MockOrderService,
      MockCustomerStore,
      MockCommerce,
    ],
    inject: [MockCommerce],
    useFactory: (commerce: MockCommerce) => {
      const mapped = withMappers(commerce, options.mappers)
      return {
        ...mapped,
        // through the mapped cart service, so the cart comes back with the shop's hook (which reads the fields)
        setCartFields: (cartId: string, fields: Record<string, unknown>) =>
          mapped.cartService.setFields(cartId, fields),
      }
    },
  })

export default commercePort()
