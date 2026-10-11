import { Injectable } from '@nestjs/common'
import type { MockServiceProvider } from './interfaces'
import {
  ProductService,
  ProductCollectionService,
  ProductSearchService,
  SearchService,
  NavigationService,
  CartService,
  CartPaymentService,
  StoreConfigService,
  PaymentService,
  PageService,
  LayoutService,
  WishlistService,
} from './services'

@Injectable()
export class MockServiceProviderImpl implements MockServiceProvider {
  constructor(
    private readonly productService: ProductService,
    private readonly productCollectionService: ProductCollectionService,
    private readonly productSearchService: ProductSearchService,
    private readonly searchService: SearchService,
    private readonly navigationService: NavigationService,
    private readonly cartService: CartService,
    private readonly cartPaymentService: CartPaymentService,
    private readonly storeConfigService: StoreConfigService,
    private readonly paymentService: PaymentService,
    private readonly pageService: PageService,
    private readonly layoutService: LayoutService,
    private readonly wishlistService: WishlistService
  ) {}

  getServices() {
    return {
      productService: this.productService,
      productCollectionService: this.productCollectionService,
      productSearchService: this.productSearchService,
      searchService: this.searchService,
      navigationService: this.navigationService,
      cartService: this.cartService,
      cartPaymentService: this.cartPaymentService,
      storeConfigService: this.storeConfigService,
      paymentService: this.paymentService,
      pageService: this.pageService,
      wishlistService: this.wishlistService,
      layoutService: this.layoutService,
    }
  }
}
