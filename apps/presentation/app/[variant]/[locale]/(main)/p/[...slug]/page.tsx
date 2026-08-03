import type { Metadata } from 'next'
import { initRouteContext } from '@/lib/request-context/route-context'
import { ProductPage } from '@/features/product/product-page'
import { getProductPage } from '@/features/product/get-product-page'
import { buildProductPageMetadata } from '@/features/product/build-product-page-metadata'
import { AddToCart } from '@/features/cart/cart-add-to-cart'
import { AddToWishlist } from '@/features/wishlist/add-to-wishlist'
import { getSiteBaseUrl } from '@/lib/site-url'
import { logger } from '@/lib/logger'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; slug: string[] }>
  searchParams: Promise<{ variantId?: string }>
}): Promise<Metadata> {
  const [{ variant, locale, slug }, { variantId: variantIdParam }] =
    await Promise.all([params, searchParams])
  initRouteContext({ variant, locale })
  const slugString = Array.isArray(slug) ? slug.join('/') : slug
  const variantId =
    typeof variantIdParam === 'string' ? variantIdParam : undefined

  try {
    // variantId is threaded through so this hits the same React-cached fetch the
    // render performs — calling with different arguments would issue a second BFF
    // request on every variant URL. The canonical stays variant-free regardless
    // (see buildProductPageMetadata), only the title/description/image follow the
    // selected variant.
    const pageData = await getProductPage(slugString, variantId)
    return buildProductPageMetadata({
      pageData,
      localePrefix: locale,
      baseUrl: getSiteBaseUrl(),
    })
  } catch (error) {
    logger.error(
      {
        slug: slugString,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to build product page metadata'
    )
    // A missing product 404s in the render, but a transient BFF failure renders an
    // error state with HTTP 200 — which must not be indexed as if it were the product.
    return { robots: 'noindex, follow' }
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string; slug: string[] }>
  searchParams: Promise<{ variantId?: string }>
}) {
  const { variant, locale, slug } = await params
  const { variantId: variantIdParam } = await searchParams
  initRouteContext({ variant, locale })
  const slugString = Array.isArray(slug) ? slug.join('/') : slug
  const variantId =
    typeof variantIdParam === 'string' ? variantIdParam : undefined

  return (
    <ProductPage
      slug={slugString}
      locale={locale}
      variantId={variantId}
      renderCtas={(product) => (
        <>
          <AddToCart
            className='flex-1'
            productId={product.id}
          />
          <AddToWishlist
            productId={product.id}
            variantId={product.variantId}
          />
        </>
      )}
    />
  )
}
