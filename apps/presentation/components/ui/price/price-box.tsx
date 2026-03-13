import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { DecoratedPrice } from './decorated-price'
import { FormattedPrice } from './formatted-price'
import type { DetailedPriceResponse } from '@core/contracts/core/detailed-price'

const priceBoxVariants = cva('flex flex-col items-start whitespace-nowrap', {
  variants: {
    size: {
      small: 'text-base/none',
      medium: 'text-base/none',
      large: 'text-xl/none',
    },
    variant: {
      regular: 'text-green-500',
      discount: 'text-blue-500',
      disabled: 'text-gray-500',
    },
  },
  defaultVariants: {
    size: 'medium',
    variant: 'regular',
  },
})

function PriceBox({
  className,
  size,
  price,
  disabled = false,
  header,
  footer,
  recommendedRetailPriceLabel,
  omnibusPriceLabel,
  locale,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof priceBoxVariants> & {
    price: DetailedPriceResponse
    disabled?: boolean
    header?: string
    footer?: string
    recommendedRetailPriceLabel?: string
    omnibusPriceLabel?: string
    locale: string
  }) {
  const variant = disabled
    ? 'disabled'
    : price.discountedPriceInCents
      ? 'discount'
      : 'regular'

  return (
    <div>
      <div
        className={cn(priceBoxVariants({ size, variant, className }))}
        {...props}
      >
        {header && <span className='font-bold italic'>{header}</span>}

        <DecoratedPrice
          price={
            price.discountedPriceInCents
              ? price.discountedPriceInCents
              : price.regularPriceInCents
          }
          currency={price.currency}
          fractionDigits={price.fractionDigits}
          variant={variant}
          size={size}
          locale={locale}
          {...(price.discountedPriceInCents && {
            originalPrice: price.regularPriceInCents,
          })}
          taxNote={footer}
        />

        {footer && <span className='sr-only'>{footer}</span>}
      </div>

      {price.recommendedRetailPriceInCents !== undefined &&
        recommendedRetailPriceLabel && (
          <FormattedPrice
            value={price.recommendedRetailPriceInCents}
            currency={price.currency}
            fractionDigits={price.fractionDigits}
            prefix={`${recommendedRetailPriceLabel}`}
            locale={locale}
            className='mt-1 text-xs/[1.6]'
          />
        )}

      {price.discountedPriceInCents !== undefined &&
        price.omnibusPriceInCents !== undefined &&
        omnibusPriceLabel && (
          <FormattedPrice
            value={price.omnibusPriceInCents}
            currency={price.currency}
            fractionDigits={price.fractionDigits}
            prefix={`${omnibusPriceLabel}`}
            locale={locale}
            className='mt-0.5 text-xs/[1.6]'
          />
        )}

      {price.regularUnitPriceInCents && (
        <FormattedPrice
          regularUnitPrice={price.regularUnitPriceInCents}
          currency={price.currency}
          fractionDigits={price.fractionDigits}
          unit={price.unit}
          locale={locale}
          className={cn(
            {
              'mt-1': size === 'small',
              'mt-1.5': size !== 'small',
            },
            'text-xs/[1.6]'
          )}
        />
      )}
    </div>
  )
}

export { PriceBox, priceBoxVariants }
