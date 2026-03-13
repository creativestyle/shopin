import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { RegistrationSuccessWithHref } from './registration-success-with-href'
import { AuthPageGuard } from '../../auth-page-guard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function RegistrationSuccessPage() {
  const t = await getTranslations('account.registrationSuccess')

  return (
    <AuthPageGuard>
      <StandardContainer className='py-4 pb-16'>
        <div className='mx-auto mt-2 flex w-full max-w-md flex-col items-start px-3 sm:px-6'>
          <div className='flex w-full flex-col items-center'>
            <Link
              href='/sign-in'
              className='mb-5 flex items-center gap-4 text-sm text-gray-700 underline'
            >
              <ChevronLeftIcon className='size-6' />
              {t('backToSignIn')}
            </Link>
          </div>
        </div>
        <div className='h-px w-full border-t border-gray-200' />
        <div className='mx-auto mt-12 flex w-full max-w-md flex-col items-start px-3 sm:px-6'>
          <Suspense fallback={<LoadingSpinner className='size-8' />}>
            <RegistrationSuccessWithHref />
          </Suspense>
        </div>
      </StandardContainer>
    </AuthPageGuard>
  )
}
