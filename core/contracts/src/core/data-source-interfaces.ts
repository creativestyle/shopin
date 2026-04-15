import type { ProductResponse } from '@core/contracts/product/product'
import type { ProductCollectionResponse } from '@core/contracts/product-collection/product-collection'
import type { Filters } from '@core/contracts/product-collection/product-collection-page'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type {
  LoginRequest,
  LoginResponse,
  TokenFields,
} from '@core/contracts/auth/login'
import type {
  RegisterRequest,
  RegisterResponse,
} from '@core/contracts/auth/register'
import type { LogoutRequest } from '@core/contracts/auth/logout'
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@core/contracts/auth/refresh-token'
import type {
  AnonymousSessionResponse,
  AnonymousSessionTokenFields,
} from '@core/contracts/auth/anonymous-session'
import type {
  ConfirmEmailRequest,
  ConfirmEmailResponse,
} from '@core/contracts/auth/confirm-email'
import type {
  GenerateEmailTokenRequest,
  GenerateEmailTokenResponse,
} from '@core/contracts/auth/generate-email-token'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from '@core/contracts/auth/forgot-password'
import type {
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@core/contracts/auth/reset-password'
import type {
  ChangeCustomerPasswordRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from '@core/contracts/customer/customer'
import type {
  CartResponse,
  SetBillingAddressRequest,
  SetShippingAddressRequest,
} from '@core/contracts/cart/cart'
import type {
  ShippingMethodsResponse,
  SetShippingMethodRequest,
} from '@core/contracts/cart/shipping-method'
import type {
  PaymentMethodsResponse,
  SetPaymentMethodRequest,
} from '@core/contracts/cart/payment-method'
import {
  AddAddressRequest,
  AddressesResponse,
  AddressResponse,
  UpdateAddressRequest,
} from '@core/contracts/customer/address'
import type { StoreConfigResponse } from '@core/contracts/store-config/store-config'
import type {
  CreateOrderRequest,
  GetOrdersRequest,
  OrderResponse,
  OrdersResponse,
} from '@core/contracts/order/order'
import type { SortOption } from '@config/constants'
import type {
  WishlistResponse,
  AddToWishlistRequest,
  RemoveFromWishlistRequest,
} from '@core/contracts/wishlist/wishlist'
import type { ContentPageResponse } from '@core/contracts/content/page'
import type {
  HeaderResponse,
  FooterResponse,
} from '@core/contracts/content/layout'
import type { ProductSearchResponse } from '@core/contracts/product-search/product-search'
import type { SearchProvider } from '@core/contracts/product-search/search-provider'

// Define service interfaces for type safety
export interface ProductService {
  getProduct(productSlug: string, variantId?: string): Promise<ProductResponse>
}

export interface ProductSearchParams {
  query: string
  faceted?: boolean
  limit?: number
  page?: number
  filters?: Filters
  priceMin?: number
  priceMax?: number
  sort?: SortOption
  saleOnly?: boolean
}

export interface ProductSearchService {
  searchProducts(params: ProductSearchParams): Promise<ProductSearchResponse>
}

/**
 * Service for fetching product collections (categories) with pagination and sorting support.
 * Handles retrieval of products organized by category, including breadcrumb navigation.
 */
export interface ProductCollectionService {
  /**
   * Fetches a paginated product collection by slug.
   * @param productCollectionSlug - The category slug to fetch products for
   * @param page - Page number (1-indexed) for pagination
   * @param limit - Maximum number of products to return per page
   * @param sort - Sort option for ordering results
   * @param filters - Optional filters to apply to the search
   * @param saleOnly - When true, only return discounted products
   * @param priceMin - Minimum price in cents (optional)
   * @param priceMax - Maximum price in cents (optional)
   * @returns Promise resolving to product list, breadcrumb, total count, and facets
   */
  getProductCollection(
    productCollectionSlug: string,
    page: number,
    limit: number,
    sort?: SortOption,
    filters?: Filters,
    saleOnly?: boolean,
    priceMin?: number,
    priceMax?: number
  ): Promise<ProductCollectionResponse>
}

export interface NavigationService {
  getNavigation(): Promise<MainNavigationResponse>
}

export interface CartService {
  getCart(cartId: string): Promise<CartResponse>
  createCart(): Promise<CartResponse>
  addToCart(
    cartId: string,
    productId: string,
    variantId?: string,
    quantity?: number
  ): Promise<CartResponse>
  updateCartItem(
    cartId: string,
    lineItemId: string,
    quantity: number
  ): Promise<CartResponse>
  removeCartItem(cartId: string, lineItemId: string): Promise<CartResponse>
  setBillingAddress(
    cartId: string,
    address: SetBillingAddressRequest
  ): Promise<CartResponse>
  setShippingAddress(
    cartId: string,
    address: SetShippingAddressRequest
  ): Promise<CartResponse>
  getShippingMethods(cartId: string): Promise<ShippingMethodsResponse>
  setShippingMethod(
    cartId: string,
    request: SetShippingMethodRequest
  ): Promise<CartResponse>
  getActiveCart(): Promise<CartResponse | null>
}

export interface CartPaymentService {
  setPaymentMethod(
    cartId: string,
    request: SetPaymentMethodRequest
  ): Promise<CartResponse>
  verifyAndUpdatePaymentAmounts(cartId: string): Promise<void>
}

export interface CustomerService {
  getCurrentCustomer(): Promise<CustomerResponse>
  updateCustomer(
    updateCustomerRequest: UpdateCustomerRequest
  ): Promise<CustomerResponse>
  changeCustomerPassword(
    changeCustomerPasswordRequest: ChangeCustomerPasswordRequest
  ): Promise<void>
}

export interface CustomerAddressService {
  getAddresses(): Promise<AddressesResponse>
  addAddress(addAddressRequest: AddAddressRequest): Promise<AddressResponse>
  updateAddress(
    updateAddressRequest: UpdateAddressRequest
  ): Promise<AddressResponse>
  deleteAddress(addressId: string): Promise<void>
  setDefaultShippingAddress(addressId: string): Promise<void>
  setDefaultBillingAddress(addressId: string): Promise<void>
}

export interface LoginService {
  login(loginRequest: LoginRequest): Promise<LoginResponse & TokenFields>
}

export interface RegisterService {
  register(registerRequest: RegisterRequest): Promise<RegisterResponse>
}

export interface LogoutService {
  logout(logoutRequest: LogoutRequest): Promise<void>
}

export interface RefreshTokenService {
  refreshToken(
    refreshTokenRequest: RefreshTokenRequest
  ): Promise<RefreshTokenResponse>
}

export interface AnonymousSessionService {
  createAnonymousSession(): Promise<
    AnonymousSessionResponse & AnonymousSessionTokenFields
  >
}

export interface StoreConfigService {
  getStoreConfig(): Promise<StoreConfigResponse>
}

export interface PageService {
  getPage(
    slug: string,
    locale: string,
    preview: boolean
  ): Promise<ContentPageResponse>
}

export interface LayoutService {
  getHeader(locale: string, preview?: boolean): Promise<HeaderResponse | null>
  getFooter(locale: string, preview?: boolean): Promise<FooterResponse | null>
}

export interface PaymentService {
  getPaymentMethods(cartId?: string): Promise<PaymentMethodsResponse>
  getPaymentLink(cartId: string): Promise<{ paymentLink: string }>
}

export interface OrderService {
  createOrder(request: CreateOrderRequest): Promise<OrderResponse>
  getOrder(orderId: string): Promise<OrderResponse>
  getOrders(request?: GetOrdersRequest): Promise<OrdersResponse>
}

export interface WishlistService {
  getWishlist(
    wishlistId: string,
    page?: number,
    limit?: number
  ): Promise<WishlistResponse>
  getOrCreateWishlist(): Promise<WishlistResponse>
  addToWishlist(
    wishlistId: string,
    request: AddToWishlistRequest
  ): Promise<WishlistResponse>
  removeFromWishlist(
    wishlistId: string,
    request: RemoveFromWishlistRequest
  ): Promise<WishlistResponse>
}

export interface ConfirmEmailService {
  confirmEmail(
    confirmEmailRequest: ConfirmEmailRequest
  ): Promise<ConfirmEmailResponse>
}

export interface GenerateEmailTokenService {
  generateEmailToken(
    generateEmailTokenRequest: GenerateEmailTokenRequest
  ): Promise<GenerateEmailTokenResponse>
}

export interface ForgotPasswordService {
  forgotPassword(
    forgotPasswordRequest: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse>
}

export interface ResetPasswordService {
  resetPassword(
    resetPasswordRequest: ResetPasswordRequest
  ): Promise<ResetPasswordResponse>
}

// All main services record - add new services here and they'll be available to all providers
export interface AllServices {
  productService: ProductService
  productCollectionService: ProductCollectionService
  productSearchService: ProductSearchService
  navigationService: NavigationService
  cartService: CartService
  cartPaymentService: CartPaymentService
  storeConfigService: StoreConfigService
  paymentService: PaymentService
  customerService: CustomerService
  customerAddressService: CustomerAddressService
  orderService: OrderService
  wishlistService: WishlistService
  pageService: PageService
  layoutService: LayoutService
  searchService: SearchProvider
}

// All auth services record - add new auth services here and they'll be available to all providers
export interface AllAuthServices {
  loginService: LoginService
  registerService: RegisterService
  logoutService: LogoutService
  refreshTokenService: RefreshTokenService
  anonymousSessionService: AnonymousSessionService
  confirmEmailService: ConfirmEmailService
  generateEmailTokenService: GenerateEmailTokenService
  forgotPasswordService: ForgotPasswordService
  resetPasswordService: ResetPasswordService
}

// Base service provider interface - modules can extend this with Pick to select which services they support
export interface BaseServiceProvider<
  T extends Partial<AllServices> = AllServices,
> {
  getServices(): T
}

// Base auth service provider interface - modules can extend this with Pick to select which services they support
export interface BaseAuthServiceProvider<
  T extends Partial<AllAuthServices> = AllAuthServices,
> {
  getAuthServices(): T
}
