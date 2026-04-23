import { cn } from '@/lib/utils'
import { formatPriceWithPrefix } from '@/lib/price-formatter'

type BaseProps = {
  currency: string
  fractionDigits?: number
  className?: string
  locale: string
}

type UnitModeProps = BaseProps & {
  regularUnitPrice: number
  unit?: string
  value?: never
  prefix?: never
}

type ValueModeProps = BaseProps & {
  value: number
  prefix?: string
  regularUnitPrice?: never
  unit?: never
}

type Props = UnitModeProps | ValueModeProps

function FormattedPrice(props: Props) {
  const locale = props.locale
  const currency = props.currency
  const fractionDigits = props.fractionDigits
  const className = props.className

  const isValueMode = 'value' in props && props.value !== undefined
  const amount = isValueMode ? props.value : props.regularUnitPrice

  if (amount === undefined) {
    return null
  }

  const formattedPrice = formatPriceWithPrefix(amount, locale, {
    currency,
    fractionDigits,
  })

  if (isValueMode) {
    return (
      <p className={cn('leading-[1.5] text-gray-500', className)}>
        {props.prefix ? `${props.prefix} ${formattedPrice}` : formattedPrice}
      </p>
    )
  }

  return (
    <p className={cn('leading-[1.5] text-gray-500', className)}>
      {`${formattedPrice}${props.unit ? ` / ${props.unit}` : ''}`}
    </p>
  )
}

export { FormattedPrice }
