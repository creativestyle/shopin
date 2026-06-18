import type { ReactNode } from 'react'
import { initRouteContext } from '@/lib/request-context/route-context'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SiteTopBar } from '@/components/layout/site-top-bar'
import { PageShell, PageContent } from '@/components/layout/page-shell'
import { StripPreviewToken } from '@/components/layout/strip-preview-token'

export default async function PreviewLayout({
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
      <StripPreviewToken />
      <SiteTopBar isDraft />
      <Header isDraft />
      <PageContent>{children}</PageContent>
      <Footer isDraft />
    </PageShell>
  )
}
