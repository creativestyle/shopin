'use client'

import { FC } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useOrders } from './hooks/use-orders'
import { OrderHistoryItem } from './components/order-history-item'
import { OrderHistoryRow } from './components/order-history-row'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorDisplay } from '@/components/ui/error-display'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import ChevronRightIcon from '@/public/icons/chevronright.svg'

const COLUMN_KEYS = [
  'products',
  'date',
  'orderNumber',
  'price',
  'status',
] as const

export const OrderHistoryList: FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('orderHistory')

  const currentPage = Math.max(1, Number(searchParams.get('page')) || 1)
  const { orders, total, limit, offset, isLoading, error } = useOrders({
    page: currentPage,
  })

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  if (isLoading) {
    return <LoadingSpinner className='size-6' />
  }

  if (error) {
    return <ErrorDisplay className='py-4'>{t('loadError')}</ErrorDisplay>
  }

  if (orders.length === 0 && currentPage === 1) {
    return (
      <div className='py-8 text-center'>
        <div className='flex w-full flex-col items-center px-0'>
          <p className='mb-4 text-gray-600'>{t('emptyOrders')}</p>

          <Button
            variant='secondary'
            scheme='black'
            className='flex-1 text-center lg:flex-none'
            asChild
          >
            <Link href='/'>{t('continueShopping')}</Link>
          </Button>
        </div>
      </div>
    )
  }

  const totalPages = Math.ceil(total / limit)
  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div>
      <OrderHistoryRow className='hidden pb-3 lg:px-4'>
        {COLUMN_KEYS.map((key) => (
          <span
            key={key}
            className='text-xs font-bold text-gray-500'
          >
            {t(`columns.${key}`)}
          </span>
        ))}
        <span />
      </OrderHistoryRow>

      {orders.map((order) => (
        <OrderHistoryItem
          key={order.id}
          order={order}
        />
      ))}

      <div className='flex items-center justify-between border-t border-gray-200 pt-4'>
        <div className='text-sm text-gray-600'>
          {t('showingResults', {
            from: offset + 1,
            to: Math.min(offset + limit, total),
            total,
          })}
        </div>
        {totalPages > 1 && (
          <div className='flex items-center gap-2'>
            <Button
              variant='secondary'
              scheme='black'
              onClick={() => navigateToPage(currentPage - 1)}
              disabled={!hasPrevious}
              className='h-9 min-w-9 gap-1 px-3 text-sm'
            >
              <ChevronLeftIcon className='h-4 w-4' />
              {t('previous')}
            </Button>
            <span className='px-3 py-1 text-sm'>
              {t('pageOf', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant='secondary'
              scheme='black'
              onClick={() => navigateToPage(currentPage + 1)}
              disabled={!hasNext}
              className='h-9 min-w-9 gap-1 px-3 text-sm'
            >
              {t('next')}
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
