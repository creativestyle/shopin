import type { ReactNode } from 'react'
import { initRouteContext } from '@/lib/request-context/route-context'
import { SiteTopBar } from '@/components/layout/site-top-bar'

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
    <>
      <SiteTopBar />
      {children}
    </>
  )
}
