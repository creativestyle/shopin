import { FC } from 'react'
import { useTranslations } from 'next-intl'
import { type OrderState } from '@core/contracts/order/order'
import { Badge } from '@/components/ui/badge/badge'
import { cn } from '@/lib/utils'

interface OrderStateBadgeProps {
  state: OrderState
  className?: string
}

export const OrderStateBadge: FC<OrderStateBadgeProps> = ({
  state,
  className,
}) => {
  const t = useTranslations('orderHistory.orderState')

  return (
    <Badge
      className={cn(
        'text-xs',
        {
          'bg-green-100 text-green-800':
            state === 'Complete' || state === 'Delivered',
          'bg-red-100 text-red-800': state === 'Cancelled',
          'bg-orange-100 text-orange-800':
            state === 'Processing' || state === 'Shipped',
          'bg-blue-100 text-blue-800': state === 'Open',
          'bg-gray-100 text-gray-800': state === 'Confirmed',
        },
        className
      )}
    >
      {t(state)}
    </Badge>
  )
}
