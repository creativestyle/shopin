import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { StandardContainer } from '@/components/ui/standard-container'

export async function CheckoutFooter() {
  const t = await getTranslations('checkout.footer')

  return (
    <footer className='w-full bg-gray-950 py-6 text-white'>
      <StandardContainer>
        <div className='flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-0'>
          {/* Copyright on the left */}
          <div className='text-sm font-bold text-white'>{t('copyright')}</div>

          {/* Links on the right */}
          <div className='flex flex-col items-start gap-2.5 text-sm text-white md:flex-row md:items-center md:gap-6'>
            <Link
              href='/imprint'
              className='transition-colors hover:text-gray-300'
            >
              {t('imprint')}
            </Link>
            <Link
              href='/terms'
              className='transition-colors hover:text-gray-300'
            >
              {t('terms')}
            </Link>
            <Link
              href='/privacy'
              className='transition-colors hover:text-gray-300'
            >
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </StandardContainer>
    </footer>
  )
}
