import { Injectable } from '@nestjs/common'
import { CommercetoolsServiceProvider } from './interfaces'
import { CommercetoolsGuestSessionService } from '@integrations/commercetools-core'
import {
  ProductService,
  ProductCollectionService,
  ProductSearchService,
  NavigationService,
  CommercetoolsCustomerService,
  CommercetoolsCustomerAddressService,
  CartService,
  CartPaymentService,
  StoreConfigService,
  OrderService,
  WishlistService,
  CommercetoolsCustomerStore,
} from './services'

@Injectable()
export class CommercetoolsServiceProviderImpl implements CommercetoolsServiceProvider {
  constructor(
    private readonly productService: ProductService,
    private readonly productCollectionService: ProductCollectionService,
    private readonly productSearchService: ProductSearchService,
    private readonly navigationService: NavigationService,
    private readonly customerService: CommercetoolsCustomerService,
    private readonly customerAddressService: CommercetoolsCustomerAddressService,
    private readonly cartService: CartService,
    private readonly cartPaymentService: CartPaymentService,
    private readonly storeConfigService: StoreConfigService,
    private readonly orderService: OrderService,
    private readonly wishlistService: WishlistService,
    readonly customers: CommercetoolsCustomerStore,
    readonly guestSession: CommercetoolsGuestSessionService
  ) {}

  getServices() {
    return {
      productService: this.productService,
      productCollectionService: this.productCollectionService,
      productSearchService: this.productSearchService,
      navigationService: this.navigationService,
      customerService: this.customerService,
      customerAddressService: this.customerAddressService,
      cartService: this.cartService,
      cartPaymentService: this.cartPaymentService,
      storeConfigService: this.storeConfigService,
      orderService: this.orderService,
      wishlistService: this.wishlistService,
    }
  }
}
