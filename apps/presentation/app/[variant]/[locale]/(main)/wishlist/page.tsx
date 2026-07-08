import { initRouteContext } from '@/lib/request-context/route-context'
import { WishlistPage } from '@/features/wishlist/wishlist-page'
import { MIN_PAGE } from '@config/constants'

export const dynamic = 'force-dynamic'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { variant, locale } = await params
  const { page: pageParam } = await searchParams
  initRouteContext({ variant, locale })
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
