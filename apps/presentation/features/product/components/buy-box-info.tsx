import React from 'react'
import ReturnsIcon from '@/public/icons/returns.svg'
import DeliveryTruckIcon from '@/public/icons/delivery-truck.svg'
import CoinsIcon from '@/public/icons/coins.svg'

export interface BuyBoxInfoProps {
  deliveryEstimate?: string
  className?: string
  returnsPolicyLabel: string
  freeReturnLabel: string
  loyaltyBonusLabel: string
}

export const BuyBoxInfo: React.FC<BuyBoxInfoProps> = ({
  deliveryEstimate,
  className,
  returnsPolicyLabel,
  freeReturnLabel,
  loyaltyBonusLabel,
}) => {
  return (
    <div className={className}>
      {/* Availability + Reserve in store */}
      <div className='mt-3 flex flex-col gap-2 text-sm/[1.6] text-gray-950'>
        {deliveryEstimate && (
          <div className='flex items-center gap-3'>
            <span
              className='flex size-6 shrink-0 items-center justify-center'
              aria-hidden
            >
              <span className='size-2 rounded-full bg-success' />
            </span>
            <span>{deliveryEstimate}</span>
          </div>
        )}
      </div>

      {/* Separator between availability and benefits */}
      <div className='my-3 h-px bg-gray-200' />

      {/* Benefits */}
      <div className='flex flex-col gap-3 text-sm/[1.6] text-gray-950'>
        <div className='flex items-center gap-3'>
          <span
            className='flex size-6 shrink-0 items-center justify-center text-gray-950'
            aria-hidden
          >
            <ReturnsIcon />
          </span>
          <span>{returnsPolicyLabel}</span>
        </div>
        <div className='flex items-center gap-3'>
          <span
            className='flex size-6 shrink-0 items-center justify-center text-gray-950'
            aria-hidden
          >
            <DeliveryTruckIcon />
          </span>
          <span>{freeReturnLabel}</span>
        </div>
        <div className='flex items-center gap-3'>
          <span
            className='flex size-6 shrink-0 items-center justify-center text-gray-950'
            aria-hidden
          >
            <CoinsIcon />
          </span>
          <span>{loyaltyBonusLabel}</span>
        </div>
      </div>
    </div>
  )
}
