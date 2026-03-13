import { WishlistPage } from '@/features/wishlist/wishlist-page'
import { MIN_PAGE } from '@config/constants'

interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { locale } = await params
  const resolvedSearchParams = await searchParams

  const pageParam = resolvedSearchParams.page
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
