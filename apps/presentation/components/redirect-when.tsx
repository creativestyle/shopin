'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface RedirectWhenProps {
  children: React.ReactNode
  /** When true, redirect to redirectTo. Page owns the destination. */
  when: boolean
  redirectTo: string
  /** When true, show loading instead of children. */
  isLoading?: boolean
  loadingComponent?: React.ReactNode
}

/**
 * Redirects to redirectTo when `when` is true. Shows loading while isLoading.
 * Generic routing primitive; condition and destination are provided by the caller (e.g. page).
 */
export function RedirectWhen({
  children,
  when,
  redirectTo,
  isLoading = false,
  loadingComponent = <LoadingSpinner className='size-8 min-h-[70vh]' />,
}: RedirectWhenProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && when) {
      router.push(redirectTo)
    }
  }, [when, isLoading, router, redirectTo])

  if (isLoading || when) {
    return <>{loadingComponent}</>
  }

  return <>{children}</>
}
