import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'

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

  return <>{children}</>
}
