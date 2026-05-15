'use client'

import { useTranslations } from 'next-intl'
import ArrowLeftIcon from '@/public/icons/arrow-left.svg'
import ArrowRightIcon from '@/public/icons/arrow-right.svg'
import { cn } from '@/lib/utils'
import { MIN_PAGE } from '@config/constants'
import { Button } from './button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPaginationChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPaginationChange,
  className,
}: PaginationProps) {
  const t = useTranslations('pagination')

  const goToPage = (page: number) => {
    if (page < MIN_PAGE || page > totalPages) {
      return
    }
    onPaginationChange(page)
  }

  const canGoPrevious = currentPage > MIN_PAGE
  const canGoNext = currentPage < totalPages

  if (totalPages <= MIN_PAGE) {
    return null
  }

  return (
    <nav
      className={cn('flex items-center justify-center gap-10', className)}
      aria-label={t('ariaLabel')}
    >
      <Button
        size='icon'
        onClick={() => goToPage(currentPage - 1)}
        disabled={!canGoPrevious}
        aria-label={t('previousPage')}
      >
        <ArrowLeftIcon
          aria-hidden='true'
          className='size-6'
        />
      </Button>

      <span
        className='text-base font-medium'
        aria-current='page'
        aria-live='polite'
        aria-atomic='true'
      >
        {t('pageOf', { currentPage, totalPages })}
      </span>

      <Button
        size='icon'
        onClick={() => goToPage(currentPage + 1)}
        disabled={!canGoNext}
        aria-label={t('nextPage')}
      >
        <ArrowRightIcon
          aria-hidden='true'
          className={cn('size-6', canGoNext ? 'text-white' : 'text-gray-400')}
        />
      </Button>
    </nav>
  )
}
