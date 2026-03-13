'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Pagination } from '@/components/ui/pagination'
import { MIN_PAGE } from '@config/constants'

interface PaginationWrapperProps {
  currentPage: number
  totalPages: number
  className?: string
}

/**
 * Client wrapper component that handles pagination navigation.
 * Manages URL search parameters and routes to new pages.
 */
export function PaginationWrapper({
  currentPage,
  totalPages,
  className,
}: PaginationWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePaginationChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (newPage === MIN_PAGE) {
      params.delete('page')
    } else {
      params.set('page', newPage.toString())
    }
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    router.push(url)
  }

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPaginationChange={handlePaginationChange}
      className={className}
    />
  )
}
