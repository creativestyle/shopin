import { type FC, type PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

interface OrderHistoryRowProps extends PropsWithChildren {
  className?: string
}

export const OrderHistoryRow: FC<OrderHistoryRowProps> = ({
  className,
  children,
}) => (
  <div
    className={cn(
      'flex flex-col gap-3 lg:grid lg:grid-cols-[12rem_5rem_6rem_1fr_7rem] lg:items-center lg:gap-x-2 xl:grid-cols-[12rem_5rem_6rem_1fr_7rem_7rem] xl:gap-x-6',
      className
    )}
  >
    {children}
  </div>
)
