import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'

import { cn } from '@/lib/utils'

function Label({
  className,
  required,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> & { required?: boolean }) {
  return (
    <LabelPrimitive.Root
      data-slot='label'
      className={cn(
        'flex items-center gap-2 leading-[1.5] text-gray-950 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:cursor-not-allowed group-data-[disabled=true]:text-gray-500 peer-disabled:cursor-not-allowed peer-disabled:text-gray-500',
        {
          'after:content-["*"]': required,
        },
        className
      )}
      {...props}
    />
  )
}

export { Label }
