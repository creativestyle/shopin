import { getTranslations } from 'next-intl/server'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { CartContent } from '@/features/cart/cart-content'
import { CartTitleCount } from '@/features/cart/cart-title-count'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function CartPage() {
  const t = await getTranslations('cart')

  const breadcrumbs = [
    {
      label: t('cart'),
      path: '/cart',
    },
  ]

  return (
    <StandardContainer className='py-4 pb-16'>
      <Breadcrumbs
        crumbs={breadcrumbs}
        className='pb-4'
      />
      <div className='flex flex-col'>
        <h1 className='mt-2 mb-6 text-center text-2xl font-normal whitespace-nowrap text-gray-950 lg:mt-4 lg:mb-8 lg:text-4xl'>
          <CartTitleCount titleBase={t('title')} />
        </h1>
        <CartContent />
      </div>
    </StandardContainer>
  )
}
