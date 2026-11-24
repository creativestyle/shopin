import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { PREVIEW_TOKEN_COOKIE } from '@config/constants'
import { initRouteContext } from '@/lib/request-context/route-context'
import { isPreviewTokenValid } from '@/lib/draft-mode'
import { SiteTopBar } from '@/components/layout/site-top-bar'
import { DraftModeBanner } from '@/components/layout/draft-mode-banner'

export const dynamic = 'force-dynamic'

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ variant: string; locale: string }>
  children: ReactNode
}) {
  const [{ variant, locale }, cookieStore] = await Promise.all([
    params,
    cookies(),
  ])
  initRouteContext({ variant, locale })
  // Dynamic route: decide on the server so the banner is in the first paint
  const isDraftSession = isPreviewTokenValid(
    cookieStore.get(PREVIEW_TOKEN_COOKIE)?.value
  )

  return (
    <>
      <SiteTopBar />
      {isDraftSession && <DraftModeBanner />}
      {children}
    </>
  )
}
