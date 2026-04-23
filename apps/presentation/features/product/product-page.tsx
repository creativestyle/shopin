import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import type { ReactNode } from 'react'
import { getProductPage } from './get-product-page'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductGallery } from '@/components/ui/product-gallery'
import { BuyBox } from './components/buy-box'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { SEOTextSection } from '@/components/ui/seo-text-section'
import { StandardContainer } from '@/components/ui/standard-container'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCommonErrorMessage } from '@/lib/error-translation-keys'
import { ErrorDisplay } from '@/components/ui/error-display'
import { HttpError } from '@/lib/error-utils'

interface ProductPageProps {
  slug: string
  locale: string
  variantId?: string
  /** Callback to render CTA buttons (e.g. Add to cart, Add to wishlist). Receives product so callers can pass product.id. */
  renderCtas?: (product: ProductDetailsResponse) => ReactNode
}

/**
 * Server component: fetches product page data and renders product gallery, buy box, details, and SEO section.
 */
export async function ProductPage({
  slug,
  locale,
  variantId,
  renderCtas,
}: ProductPageProps) {
  const t = await getTranslations('product')
  let productData = null
  let error: string | null = null

  try {
    productData = await getProductPage(slug, variantId)
  } catch (err) {
    if (HttpError.hasStatusCode(err, 404)) {
      notFound()
    }
    error = await getCommonErrorMessage(err, () => getTranslations('common'))
  }

  if (error) {
    return (
      <StandardContainer className='p-4'>
        <ErrorDisplay centered>{error}</ErrorDisplay>
      </StandardContainer>
    )
  }

  if (!productData) {
    notFound()
  }

  return (
    <div className='py-4'>
      <StandardContainer className='pb-4'>
        <Breadcrumbs crumbs={productData.breadcrumb} />
      </StandardContainer>

      <StandardContainer className='grid grid-cols-1 gap-6 md:[grid-template-columns:minmax(0,1fr)_minmax(0,30rem)]'>
        <div className='min-w-0'>
          <ProductGallery images={productData.product.gallery.images} />
        </div>
        <div className='h-fit w-full min-w-0 md:sticky md:top-4'>
          <BuyBox
            product={productData.product}
            locale={locale}
            ctas={renderCtas?.(productData.product)}
          />
        </div>

        {/* Left column content below gallery and buy box */}
        <div className='md:col-start-1 md:col-end-2'>
          <Accordion
            type='single'
            collapsible
            defaultValue='details'
          >
            <AccordionItem value='details'>
              <AccordionTrigger>{t('details')}</AccordionTrigger>
              <AccordionContent>
                {productData.product.description}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </StandardContainer>

      {productData.product.seoText && (
        <div className='mt-12'>
          <SEOTextSection
            title={t('seo.about')}
            content={productData.product.seoText}
          />
        </div>
      )}
    </div>
  )
}
