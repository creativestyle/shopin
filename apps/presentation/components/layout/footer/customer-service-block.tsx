import type { FooterCustomerService } from '@core/contracts/content/layout'
import PhoneIcon from '../../../public/icons/phone.svg'
import ArrowRightIcon from '../../../public/icons/arrow-right.svg'

export function CustomerServiceBlock({
  customerService,
}: {
  customerService: FooterCustomerService
}) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {customerService.title}
      </h3>
      <div className='space-y-2.5'>
        {customerService.phone && (
          <div className='flex items-center gap-2.5'>
            <PhoneIcon className='size-6 text-gray-500' />
            <span className='text-base leading-normal font-bold text-gray-500'>
              {customerService.phone}
            </span>
          </div>
        )}
        {customerService.hours && (
          <p className='text-sm leading-normal font-normal text-gray-500'>
            {customerService.hours}
          </p>
        )}
      </div>
      {customerService.contactUsLabel && (
        <div className='w-fit cursor-pointer rounded-xl border border-gray-300 bg-transparent px-4 py-3 shadow-sm transition-colors hover:border-gray-400'>
          <div className='flex items-center gap-2'>
            <span className='text-sm leading-normal font-medium text-gray-900'>
              {customerService.contactUsLabel}
            </span>
            <ArrowRightIcon className='size-5 text-gray-600' />
          </div>
        </div>
      )}
    </div>
  )
}
