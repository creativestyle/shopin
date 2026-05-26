import { setRequestLocale } from 'next-intl/server'
import { ChangePasswordForm } from '@/features/customer/customer-change-password-form'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return <ChangePasswordForm />
}
