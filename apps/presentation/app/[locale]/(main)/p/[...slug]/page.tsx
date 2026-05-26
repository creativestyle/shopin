import { setRequestLocale } from 'next-intl/server'
import { ProductPage } from '@/features/product/product-page'
import { AddToCart } from '@/features/cart/cart-add-to-cart'
import { AddToWishlist } from '@/features/wishlist/add-to-wishlist'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string[] }>
  searchParams: Promise<{ variantId?: string }>
}) {
  const { locale, slug } = await params
  const { variantId: variantIdParam } = await searchParams
  setRequestLocale(locale)
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
