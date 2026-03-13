import { Suspense } from 'react'
import { VerifyEmailWithRedirect } from './verify-email-with-redirect'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function VerifyEmailRoute() {
  return (
    <Suspense fallback={<LoadingSpinner className='size-8' />}>
      <VerifyEmailWithRedirect />
    </Suspense>
  )
}
