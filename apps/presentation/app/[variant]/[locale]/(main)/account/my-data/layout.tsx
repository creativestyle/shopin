import type { ReactNode } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { AccountWrapper } from '@/features/account/account-wrapper'
import { MyDataTabs } from '@/features/account/my-data-tabs'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>
  children: ReactNode
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('account.myAccount')

  const breadcrumbs = [
    { label: t('overviewLabel'), path: '/account' },
    { label: t('myDataLabel'), path: '/account/my-data' },
  ]

  return (
    <>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='max-sm:hidden'
      />
      <AccountWrapper activePage='my-data'>
        <div className='space-y-4'>
          <h1 className='text-xl font-semibold'>{t('myDataLabel')}</h1>
          <MyDataTabs>{children}</MyDataTabs>
        </div>
      </AccountWrapper>
    </>
  )
}
