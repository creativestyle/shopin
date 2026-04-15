import React from 'react'
import { Header } from '../../../components/layout/header'
import { Footer } from '../../../components/layout/footer'
import { PageShell, PageContent } from '../../../components/layout/page-shell'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageShell>
      <Header />
      <PageContent>{children}</PageContent>
      <Footer />
    </PageShell>
  )
}
