import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { ProtectedPageGuard } from './protected-page-guard'
import { StandardContainer } from '@/components/ui/standard-container'

export const dynamic = 'force-dynamic'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>
  children: ReactNode
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <ProtectedPageGuard redirectTo={`/${locale}/sign-in`}>
      <StandardContainer className='py-4'>{children}</StandardContainer>
    </ProtectedPageGuard>
  )
}
