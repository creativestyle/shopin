import type { ReactNode } from 'react'
import { initRouteContext } from '@/lib/request-context/route-context'
import { Header } from '../../../../components/layout/header'
import { Footer } from '../../../../components/layout/footer'
import { SiteTopBar } from '../../../../components/layout/site-top-bar'
import {
  PageShell,
  PageContent,
} from '../../../../components/layout/page-shell'
import { DraftModeSessionBanner } from '@/components/layout/draft-mode-banner'

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
    <PageShell>
      <SiteTopBar />
      <DraftModeSessionBanner />
      <Header />
      <PageContent>{children}</PageContent>
      <Footer />
    </PageShell>
  )
}
