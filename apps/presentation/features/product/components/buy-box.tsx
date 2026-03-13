import { getTranslations } from 'next-intl/server'
import type { ProductDetailsResponse } from '@core/contracts/product/product-details'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PriceBox } from '@/components/ui/price/price-box'
import { Badges } from '@/components/ui/badge/badges'
import { ConfigurableOptions } from '@/components/ui/configurable-options/configurable-options'
import { BuyBoxInfo } from './buy-box-info'

export interface BuyBoxProps {
  product: ProductDetailsResponse
  locale: string
  /** CTA buttons (e.g. Add to cart, Add to wishlist) passed from the parent. */
  ctas?: ReactNode
  selectedOptions?: Record<string, string>
  onChangeOption?: (key: string, value: string) => void
  className?: string
}

export async function BuyBox({
  product,
  locale,
  ctas,
  className,
}: BuyBoxProps) {
  const t = await getTranslations('product')

  return (
    <aside
      className={cn(
        'flex w-full flex-col gap-4 pb-4 pl-0 lg:max-w-120 lg:pl-6',
        className
      )}
    >
      {!!product.badges?.length && <Badges badges={product.badges} />}
      <div className='flex flex-col gap-1'>
        <h1 className='text-xl/[1.2] text-gray-950'>{product.name}</h1>
      </div>

      <PriceBox
        price={product.price}
        locale={locale}
        recommendedRetailPriceLabel={t('buyBox.recommendedRetailPrice')}
        omnibusPriceLabel={t('buyBox.omnibusPrice')}
        footer={t('buyBox.taxNote')}
      />

      {product.configurableOptions &&
        product.configurableOptions.length > 0 && (
          <>
            <div className='h-px bg-gray-200' />
            <ConfigurableOptions
              options={product.configurableOptions}
              variants={product.variants}
            />
          </>
        )}

      {ctas != null && <div className='flex items-center gap-3'>{ctas}</div>}

      <BuyBoxInfo
        deliveryEstimate={product.deliveryEstimate}
        returnsPolicyLabel={t('buyBox.benefits.returnsPolicy')}
        freeReturnLabel={t('buyBox.benefits.freeReturn')}
        loyaltyBonusLabel={t('buyBox.benefits.loyaltyBonus')}
      />
    </aside>
  )
}
