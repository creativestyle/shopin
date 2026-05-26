import { setRequestLocale } from 'next-intl/server'
import { CustomerData } from '@/features/customer/customer-data'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <CustomerData />
}
