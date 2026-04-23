import { getLocale, getTranslations } from 'next-intl/server'
import { Logo } from '@/components/ui/logo'
import { CheckoutBackLink } from './components/checkout-back-link'
import { StandardContainer } from '@/components/ui/standard-container'
import { rfcToUrlPrefix } from '@config/constants'

export async function CheckoutHeader() {
  const [t, locale] = await Promise.all([
    getTranslations('checkout'),
    getLocale(),
  ])
  const homeHref = `/${rfcToUrlPrefix(locale)}`

  const logo = (
    <div className='relative h-12 w-40'>
      <Logo
        src='/logo.svg'
        href={homeHref}
        alt='SHOPin'
        className='size-full'
      />
    </div>
  )

  const backLink = <CheckoutBackLink label={t('backToCart')} />

  return (
    <header className='w-full'>
      {/* Mobile: Stacked layout */}
      <div className='lg:hidden'>
        {/* Logo box with shadow - full width */}
        <div className='mb-6 h-14 w-full bg-white shadow-card'>
          <StandardContainer className='flex h-full items-center justify-center'>
            {logo}
          </StandardContainer>
        </div>

        {/* Back link - outside shadow box */}
        <StandardContainer className='flex items-center'>
          {backLink}
        </StandardContainer>
      </div>

      {/* Desktop: Horizontal layout with back link and logo in same box */}
      <div className='hidden h-24 w-full bg-white shadow-card lg:block'>
        <StandardContainer className='grid h-full grid-cols-[1fr_auto_1fr] items-center'>
          {backLink}
          {logo}
          <div />
        </StandardContainer>
      </div>
    </header>
  )
}
