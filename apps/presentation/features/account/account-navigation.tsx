'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FC } from 'react'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import { cn } from '@/lib/utils'
import { ACCOUNT_NAVIGATION_ITEMS } from './lib/account-navigation-items'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/features/auth/auth-logout-button'

interface AccountNavigationProps {
  activePage: string
  hideBackButton?: boolean
}

export const AccountNavigation: FC<AccountNavigationProps> = ({
  activePage,
  hideBackButton = false,
}) => {
  const t = useTranslations('account.myAccount')
  const router = useRouter()
  const locale = useLocale()

  return (
    <nav
      className='lg:border-r lg:border-gray-50'
      aria-label={t('navigationAriaLabel')}
    >
      <ul className='hidden lg:flex lg:flex-col'>
        {Object.entries(ACCOUNT_NAVIGATION_ITEMS).map(
          ([key, { href, translationKeys, icon: Icon }]) => {
            const isActive = activePage === key
            return (
              <li key={key}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'mb-0 block flex gap-3 border-b border-gray-100 px-4 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary',
                    {
                      'bg-gray-50 font-semibold text-gray-950': isActive,
                    }
                  )}
                >
                  <Icon
                    className='size-6'
                    aria-hidden='true'
                  />
                  <span>{t(translationKeys.label)}</span>
                </Link>
              </li>
            )
          }
        )}
        <li>
          <LogoutButton
            className='w-full border-b border-gray-100 px-4 py-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-950 disabled:opacity-50'
            onAfterLogout={() => router.push(`/${locale}/sign-in`)}
          />
        </li>
      </ul>
      {!hideBackButton && (
        <ul className='mb-8 sm:hidden'>
          <li className='border-b border-gray-100'>
            <Button
              variant='tertiary'
              scheme='black'
            >
              <ChevronLeftIcon
                className='size-6'
                aria-hidden='true'
              />
              <Link href='/account'>{t('backButtonLabel')}</Link>
            </Button>
          </li>
        </ul>
      )}
    </nav>
  )
}
