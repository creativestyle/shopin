import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { Header } from '../../../components/layout/header'
import { Footer } from '../../../components/layout/footer'
import { PageShell, PageContent } from '../../../components/layout/page-shell'

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
    <PageShell>
      <Header />
      <PageContent>{children}</PageContent>
      <Footer />
    </PageShell>
  )
}
