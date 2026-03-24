import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const energyEfficiencyClassVariants = cva(
  'flex max-w-10 items-center justify-center pt-px pr-4 pl-2 text-sm leading-tight text-white [clip-path:polygon(calc(100%-10px)_0,_100%_50%,_calc(100%-10px)_100%,_0_100%,_0_0)]',
  {
    variants: {
      energyClass: {
        A: 'bg-[#00A651]',
        B: 'bg-[#51B848]',
        C: 'bg-[#BFD72F]',
        D: 'bg-[#FFF200]',
        E: 'bg-[#FDB912]',
        F: 'bg-[#F37022]',
        G: 'bg-[#ED1B24]',
      },
    },
  }
)

export type EnergyEfficiencyClassLetter = NonNullable<
  VariantProps<typeof energyEfficiencyClassVariants>['energyClass']
>

type EnergyEfficiencyClassProps = React.ComponentProps<'span'> & {
  energyClass?: EnergyEfficiencyClassLetter | null
}

function EnergyEfficiencyClass({
  className,
  energyClass,
  ...props
}: EnergyEfficiencyClassProps) {
  return (
    <span
      className={cn(energyEfficiencyClassVariants({ energyClass }), className)}
      {...props}
    >
      {energyClass}
    </span>
  )
}

export {
  EnergyEfficiencyClass,
  energyEfficiencyClassVariants,
  type EnergyEfficiencyClassProps,
}
