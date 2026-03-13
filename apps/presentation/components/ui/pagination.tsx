'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { MIN_PAGE } from '@config/constants'

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
      role='navigation'
      aria-label={t('ariaLabel')}
    >
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={!canGoPrevious}
        className={cn(
          'flex h-[50px] w-[50px] items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
          canGoPrevious
            ? 'cursor-pointer bg-[var(--color-primary)] hover:opacity-90'
            : 'cursor-not-allowed bg-[var(--color-gray-100)]'
        )}
        aria-label={t('previousPage')}
      >
        <Image
          src='/icons/arrow-left.svg'
          alt=''
          width={24}
          height={24}
          aria-hidden='true'
          className={
            canGoPrevious ? 'brightness-0 invert' : 'opacity-40 grayscale'
          }
        />
      </button>

      <span
        className='text-base font-medium'
        aria-live='polite'
        aria-atomic='true'
      >
        {t('pageOf', { currentPage, totalPages })}
      </span>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={!canGoNext}
        className={cn(
          'flex h-[50px] w-[50px] items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]',
          canGoNext
            ? 'cursor-pointer bg-[var(--color-primary)] hover:opacity-90'
            : 'cursor-not-allowed bg-[var(--color-gray-100)]'
        )}
        aria-label={t('nextPage')}
      >
        <Image
          src='/icons/arrow-right.svg'
          alt=''
          width={24}
          height={24}
          aria-hidden='true'
          className={canGoNext ? 'brightness-0 invert' : 'opacity-40 grayscale'}
        />
      </button>
    </nav>
  )
}
