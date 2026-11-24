import type { ReactNode } from 'react'
import { initRouteContext } from '@/lib/request-context/route-context'
import { getRequestPath } from '@/lib/request-context/request-path'
import { redirect } from '@/lib/navigation'
import { setReturnTo } from '@/lib/return-to'
import { getServerSession } from '@/features/customer/customer-server-session'
import { ProtectedPageGuard } from './protected-page-guard'
import { StandardContainer } from '@/components/ui/standard-container'

export const dynamic = 'force-dynamic'

const SIGN_IN_PATH = '/sign-in'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ variant: string; locale: string }>
  children: ReactNode
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })

  const session = await getServerSession()
  if (session === 'signed-out') {
    const signInParams = new URLSearchParams()
    setReturnTo(signInParams, await getRequestPath())
    const query = signInParams.toString()
    redirect({
      href: query ? `${SIGN_IN_PATH}?${query}` : SIGN_IN_PATH,
      locale,
    })
  }

  return (
    <ProtectedPageGuard
      redirectTo={SIGN_IN_PATH}
      isVerifiedOnServer={session === 'signed-in'}
    >
      <StandardContainer className='py-4'>{children}</StandardContainer>
    </ProtectedPageGuard>
  )
}
