'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import { FC, ReactNode } from 'react'
import { ACCOUNT_NAVIGATION_ITEMS } from './lib/account-navigation-items'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { AccountOverviewItem } from './account-overview-item'
import { LogoutButton } from '@/features/auth/auth-logout-button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AccountOverviewProps {
  orderSlot?: ReactNode
}

export const AccountOverview: FC<AccountOverviewProps> = ({ orderSlot }) => {
  const t = useTranslations('account.myAccount')
  const router = useRouter()
  const locale = useLocale()
  const { customer, isLoading } = useCustomer()

  if (isLoading) {
    return <LoadingSpinner className='size-8' />
  }

  return (
    <>
      <h1 className='my-8 text-center text-2xl font-semibold'>
        {t('overviewWelcomeMessage', {
          name: `${customer?.firstName} ${customer?.lastName}`.trim(),
        })}
      </h1>

      <div className='grid grid-cols-1 lg:mb-8 lg:grid-cols-2 lg:gap-8'>
        <div className='lg:col-span-2'>
          <AccountOverviewItem
            label={t(ACCOUNT_NAVIGATION_ITEMS.orders.translationKeys.label)}
            description={t(
              ACCOUNT_NAVIGATION_ITEMS.orders.translationKeys.description!
            )}
            href='/account/orders'
            icon={ACCOUNT_NAVIGATION_ITEMS.orders.icon}
            className='lg:grid lg:grid-cols-2 lg:items-center'
          >
            {orderSlot}
          </AccountOverviewItem>
        </div>

        <div>
          <AccountOverviewItem
            label={t(ACCOUNT_NAVIGATION_ITEMS['my-data'].translationKeys.label)}
            description={t(
              ACCOUNT_NAVIGATION_ITEMS['my-data'].translationKeys.description!
            )}
            href='/account/my-data'
            icon={ACCOUNT_NAVIGATION_ITEMS['my-data'].icon}
          />
        </div>
      </div>

      <div className='flex justify-end'>
        <LogoutButton
          className='w-full p-6 hover:text-primary max-lg:gap-8 lg:w-auto'
          onAfterLogout={() => router.push(`/${locale}/sign-in`)}
        />
      </div>
    </>
  )
}
