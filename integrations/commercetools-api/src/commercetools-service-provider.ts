import { Injectable } from '@nestjs/common'
import { CommercetoolsServiceProvider } from './interfaces'
import {
  ProductService,
  ProductCollectionService,
  NavigationService,
  CommercetoolsCustomerService,
  CommercetoolsCustomerAddressService,
  CartService,
  CartPaymentService,
  StoreConfigService,
  OrderService,
  WishlistService,
} from './services'

@Injectable()
export class CommercetoolsServiceProviderImpl implements CommercetoolsServiceProvider {
  constructor(
    private readonly productService: ProductService,
    private readonly productCollectionService: ProductCollectionService,
    private readonly navigationService: NavigationService,
    private readonly customerService: CommercetoolsCustomerService,
    private readonly customerAddressService: CommercetoolsCustomerAddressService,
    private readonly cartService: CartService,
    private readonly cartPaymentService: CartPaymentService,
    private readonly storeConfigService: StoreConfigService,
    private readonly orderService: OrderService,
    private readonly wishlistService: WishlistService
  ) {}

  getServices() {
    return {
      productService: this.productService,
      productCollectionService: this.productCollectionService,
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
