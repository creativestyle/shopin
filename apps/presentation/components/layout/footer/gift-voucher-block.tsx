import type { FooterGiftVoucher } from '@core/contracts/content/layout'
import { CmsLink } from '@/features/content/cms-link'
import GiftIcon from '../../../public/icons/gift.svg'

export function GiftVoucherBlock({
  giftVoucher,
}: {
  giftVoucher: FooterGiftVoucher
}) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {giftVoucher.title}
      </h3>
      <div className='flex items-center gap-2'>
        <GiftIcon className='size-6 text-gray-700' />
        <CmsLink
          link={giftVoucher.link}
          className='text-sm/[1.6] font-normal text-gray-700 underline transition-colors hover:text-gray-950'
        />
      </div>
    </div>
  )
}
