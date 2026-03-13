import type { FooterNewsletter } from '@core/contracts/content/layout'
import { Button } from '../../ui/button'
import { StandardContainer } from '../../ui/standard-container'
import ArrowRightIcon from '../../../public/icons/arrow-right.svg'
import MailIcon from '../../../public/icons/mail.svg'

export function NewsletterBlock({
  newsletter,
}: {
  newsletter: FooterNewsletter
}) {
  return (
    <StandardContainer className='pt-8'>
      <div className='relative h-72 overflow-hidden rounded-2xl bg-white md:h-72'>
        <div className='absolute -top-20 -left-8 hidden size-156 opacity-10 md:block'>
          <MailIcon className='size-full text-gray-300' />
        </div>
        <div className='absolute top-[calc(50%-5.3125rem)] left-1/2 size-28 opacity-10 md:hidden'>
          <MailIcon className='size-full text-gray-300' />
        </div>
        <div className='absolute top-1/2 left-1/2 w-full -translate-1/2 transform px-4 text-center md:px-0'>
          <div className='mx-auto w-full md:w-108'>
            <h2 className='mb-4 text-center text-2xl leading-tight font-normal text-gray-900'>
              {newsletter.title}
            </h2>
            <p className='mb-6 text-center text-sm leading-normal font-normal text-gray-500'>
              {newsletter.description}{' '}
              {newsletter.voucherText && (
                <span className='font-bold text-gray-900'>
                  {newsletter.voucherText}
                </span>
              )}{' '}
              {newsletter.descriptionEnd}
            </p>
            <Button className='mx-auto w-full md:w-auto'>
              <span className='text-sm font-bold'>
                {newsletter.signUpLabel}
              </span>
              <ArrowRightIcon className='ml-2 size-5' />
            </Button>
          </div>
        </div>
      </div>
    </StandardContainer>
  )
}
