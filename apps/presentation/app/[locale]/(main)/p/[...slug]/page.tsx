import { ProductPage } from '@/features/product/product-page'
import { AddToCart } from '@/features/cart/cart-add-to-cart'
import { AddToWishlist } from '@/features/wishlist/add-to-wishlist'

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const [paramsData, sp] = await Promise.all([params, searchParams])
  const { slug, locale } = paramsData
  const slugString = Array.isArray(slug) ? slug.join('/') : slug
  const variantId = typeof sp?.variantId === 'string' ? sp.variantId : undefined

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
