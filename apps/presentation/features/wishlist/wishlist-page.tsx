import { getTranslations } from 'next-intl/server'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { StandardContainer } from '@/components/ui/standard-container'
import { WishlistContent } from './wishlist-content'

interface WishlistPageProps {
  locale: string
  page: number
}

/**
 * Server component: renders the wishlist page with breadcrumbs.
 * Content is fetched client-side via React Query for real-time updates.
 * Supports both guest users (anonymous sessions) and logged-in users.
 */
export async function WishlistPage({ locale, page }: WishlistPageProps) {
  const t = await getTranslations('wishlist')

  const breadcrumbs = [{ label: t('title'), path: '/wishlist' }]

  return (
    <StandardContainer className='py-4'>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='pb-4'
      />

      <WishlistContent
        locale={locale}
        page={page}
      />
    </StandardContainer>
  )
}
