import * as React from 'react'
import { cn } from '@/lib/utils'

interface StandardContainerProps extends React.ComponentProps<'div'> {
  className?: string
}

function StandardContainer({
  className,
  children,
  ...props
}: StandardContainerProps) {
  return (
    <div
      className={cn('ui-container ui-max-width-container', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { StandardContainer }
