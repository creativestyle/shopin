import { cn } from '@/lib/utils'
import { Badge, BadgeProps } from './badge'
import type { BadgeResponse } from '@core/contracts/core/badge'

type BadgesProps = {
  badges: BadgeResponse[]
  className?: string
  size?: BadgeProps['size']
}

function Badges({ className, badges, size = 'medium' }: BadgesProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {badges.map(
        (badge, index) =>
          badge?.text && (
            <Badge
              key={`${badge.variant}-${index}`}
              variant={badge.variant}
              size={size}
            >
              {badge.text}
            </Badge>
          )
      )}
    </div>
  )
}

export { Badges, type BadgesProps }
