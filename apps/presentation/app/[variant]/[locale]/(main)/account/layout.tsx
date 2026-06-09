import type { ReactNode } from 'react'
import { initRouteContext } from '@/lib/request-context/route-context'
import { ProtectedPageGuard } from './protected-page-guard'
import { StandardContainer } from '@/components/ui/standard-container'

export const dynamic = 'force-dynamic'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ variant: string; locale: string }>
  children: ReactNode
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  return (
    <ProtectedPageGuard redirectTo={`/${locale}/sign-in`}>
      <StandardContainer className='py-4'>{children}</StandardContainer>
    </ProtectedPageGuard>
  )
}
