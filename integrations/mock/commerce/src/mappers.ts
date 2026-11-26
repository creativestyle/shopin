import type { CartResponse } from '@core/contracts/cart/cart'
import type { ProductCollectionResponse } from '@core/contracts/product-collection/product-collection'
import type { ProductResponse } from '@core/contracts/product/product'
import type { WishlistResponse } from '@core/contracts/wishlist/wishlist'
import { cartFields } from './services/cart.service'
import type { MockOptions, MockProduct, MockProductCard } from './options'

type Mappers = NonNullable<MockOptions['mappers']>

const isCart = (value: unknown): value is CartResponse =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as CartResponse).lineItems) &&
  typeof (value as CartResponse).id === 'string'

/** Every method of `service` whose result is a cart returns `map(cart)` instead. */
function mapResults<T extends object>(
  service: T,
  map: (cart: CartResponse) => CartResponse
): T {
  return new Proxy(service, {
    get(target, key) {
      const value = Reflect.get(target, key)
      if (typeof value !== 'function') {
        return value
      }
      return async (...args: unknown[]) => {
        const result = await value.apply(target, args)
        return isCart(result) ? map(result) : result
      }
    },
  })
}

/** `record` without its catalog attributes: the mapped contract a hook receives. */
const withoutAttributes = <R extends { attributes?: unknown }>(record: R) => {
  const mapped = { ...record }
  delete mapped.attributes
  return mapped
}

const isWishlist = (value: unknown): value is WishlistResponse =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as WishlistResponse).items)

/** Every method of `service` returns `map(result)` instead (a method returning nothing passes through). */
function mapAll<T extends object>(service: T, map: (r: unknown) => unknown): T {
  return new Proxy(service, {
    get(target, key) {
      const value = Reflect.get(target, key)
      if (typeof value !== 'function') {
        return value
      }
      return async (...args: unknown[]) => map(await value.apply(target, args))
    },
  })
}

/**
 * The commerce services with the shop's mapper hooks applied after the built-in mapping: carts (from the
 * cart and the payment-method services), the product cards of a category page, of a wishlist and of the product
 * search (which serves search when no search integration is configured), and the product of the product page.
 */
export function withMappers<
  T extends {
    cartService: object
    cartPaymentService: object
    productCollectionService: {
      getProductCollection(...args: never[]): Promise<ProductCollectionResponse>
    }
    productService: object
    wishlistService: object
  },
>(commerce: T, mappers: Mappers = {}): T {
  const { cart, productCard, product } = mappers
  const out = { ...commerce }
  if (product) {
    out.productService = mapAll(commerce.productService, (r) => {
      const page = r as ProductResponse & { product: MockProduct }
      return page?.product
        ? {
            ...page,
            product: product(page.product, withoutAttributes(page.product)),
          }
        : r
    })
  }
  if (productCard) {
    out.wishlistService = mapAll(commerce.wishlistService, (r) =>
      isWishlist(r)
        ? {
            ...r,
            items: r.items.map((item) => ({
              ...item,
              product: productCard(
                item.product as MockProductCard,
                withoutAttributes(item.product as MockProductCard)
              ),
            })),
          }
        : r
    )
  }
  if (cart) {
    const map = (mapped: CartResponse) =>
      cart(
        { ...mapped, custom: { fields: { ...cartFields.get(mapped.id) } } },
        mapped
      )
    out.cartService = mapResults(commerce.cartService, map)
    out.cartPaymentService = mapResults(commerce.cartPaymentService, map)
  }
  if (productCard) {
    const collections = commerce.productCollectionService
    out.productCollectionService = new Proxy(collections, {
      get(target, key) {
        const value = Reflect.get(target, key)
        if (key !== 'getProductCollection') {
          return value
        }
        return async (...args: never[]) => {
          const page = await collections.getProductCollection(...args)
          return {
            ...page,
            productList: page.productList.map((raw: MockProductCard) =>
              productCard(raw, withoutAttributes(raw))
            ),
          }
        }
      },
    })
    const search = (
      commerce as {
        productSearchService?: {
          searchProducts(
            ...args: never[]
          ): Promise<{ products: MockProductCard[] }>
        }
      }
    ).productSearchService
    if (search) {
      ;(out as { productSearchService?: object }).productSearchService =
        new Proxy(search, {
          get(target, key) {
            const value = Reflect.get(target, key)
            if (key !== 'searchProducts') {
              return value
            }
            return async (...args: never[]) => {
              const page = await search.searchProducts(...args)
              return {
                ...page,
                products: page.products.map((raw) =>
                  productCard(raw, withoutAttributes(raw))
                ),
              }
            }
          },
        })
    }
  }
  return out
}
