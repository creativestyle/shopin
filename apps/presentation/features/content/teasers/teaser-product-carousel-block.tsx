import { getLocale, getTranslations } from 'next-intl/server'
import type { ProductCarouselTeaser } from '@core/contracts/content/teaser-product-carousel'
import { ProductCarouselSlider } from './product-carousel-slider'

export async function TeaserProductCarouselBlock({
  teaser,
  carouselId,
  imagePreload,
}: {
  teaser: ProductCarouselTeaser
  carouselId?: string
  imagePreload?: boolean
}) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations('teaser'),
  ])
  const { title, products = [] } = teaser

  if (!products.length) {
    return (
      <div className='space-y-2 pt-6'>
        {title && (
          <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
        )}
        <p className='text-sm text-gray-700'>
          {t('productCarousel.noProducts')}
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-2 pt-6'>
      {title && (
        <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
      )}
      <ProductCarouselSlider
        products={products}
        locale={locale}
        imagePreload={imagePreload}
        carouselId={carouselId}
      />
    </div>
  )
}
