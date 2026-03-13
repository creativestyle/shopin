import type { ReactNode } from 'react'
import { ProtectedPageGuard } from './protected-page-guard'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return (
    <ProtectedPageGuard redirectTo={`/${locale}/sign-in`}>
      <StandardContainer className='py-4'>{children}</StandardContainer>
    </ProtectedPageGuard>
  )
}
