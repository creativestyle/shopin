import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { formatPriceWithPrefix } from '@/lib/price-formatter'

const variants = cva('flex items-baseline font-normal', {
  variants: {
    variant: {
      regular: 'text-gray-900',
      discount: 'text-red-400',
      disabled: 'text-gray-500',
    },
    size: {
      small: 'text-xl/[1.1]',
      medium: 'text-2xl/[1.1]',
      large: 'text-3xl/[1.1]',
    },
  },
  defaultVariants: {
    variant: 'regular',
    size: 'medium',
  },
})

function DecoratedPrice({
  className,
  price,
  variant,
  size,
  currency,
  fractionDigits,
  originalPrice,
  taxNote,
  locale,
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof variants> & {
    price: number
    currency?: string
    fractionDigits?: number
    originalPrice?: number
    taxNote?: string
    locale: string
  }) {
  const formattedPrice = formatPriceWithPrefix(price, locale, {
    currency,
    fractionDigits,
  })

  return (
    <div className='flex flex-wrap items-baseline justify-end gap-1'>
      {originalPrice !== undefined && (
        <span className='order-2 text-right text-sm/[1.6] text-gray-500 line-through'>
          {formatPriceWithPrefix(originalPrice, locale, {
            currency,
            fractionDigits,
          })}
        </span>
      )}
      <div
        className={cn(
          variants({ variant, size, className }),
          'order-1 text-right'
        )}
        aria-label={formattedPrice}
        {...props}
      >
        <span>{formattedPrice}</span>
      </div>
      {taxNote && (
        <span className='text-sm/[1.6] text-gray-500'>{taxNote}</span>
      )}
    </div>
  )
}

export { DecoratedPrice, variants }
