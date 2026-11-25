import { Injectable } from '@nestjs/common'
import type { MockServiceProvider } from './interfaces'
import {
  ProductService,
  ProductCollectionService,
  ProductSearchService,
  NavigationService,
  CartService,
  CartPaymentService,
  OrderService,
  StoreConfigService,
  WishlistService,
} from './services'

@Injectable()
export class MockServiceProviderImpl implements MockServiceProvider {
  constructor(
    private readonly productService: ProductService,
    private readonly productCollectionService: ProductCollectionService,
    private readonly productSearchService: ProductSearchService,
    private readonly navigationService: NavigationService,
    private readonly cartService: CartService,
    private readonly cartPaymentService: CartPaymentService,
    private readonly orderService: OrderService,
    private readonly storeConfigService: StoreConfigService,
    private readonly wishlistService: WishlistService
  ) {}

  getServices() {
    return {
      productService: this.productService,
      productCollectionService: this.productCollectionService,
      productSearchService: this.productSearchService,
      navigationService: this.navigationService,
      cartService: this.cartService,
      cartPaymentService: this.cartPaymentService,
      orderService: this.orderService,
      storeConfigService: this.storeConfigService,
      wishlistService: this.wishlistService,
    }
  }
}
