import { setRequestLocale } from 'next-intl/server'
import { WishlistPage } from '@/features/wishlist/wishlist-page'
import { MIN_PAGE } from '@config/constants'

export const dynamic = 'force-dynamic'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  const { page: pageParam } = await searchParams
  setRequestLocale(locale)
  const page =
    typeof pageParam === 'string'
      ? Math.max(parseInt(pageParam, 10) || MIN_PAGE, MIN_PAGE)
      : MIN_PAGE

  return (
    <WishlistPage
      locale={locale}
      page={page}
    />
  )
}
