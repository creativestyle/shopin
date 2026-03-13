import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { SignUpFormWithRedirect } from './sign-up-form-with-redirect'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'
import { AuthPageGuard } from '../auth-page-guard'
import { getIsCheckoutServer } from '@/features/checkout/checkout-param-utils'
import { StandardContainer } from '@/components/ui/standard-container'

interface SignUpPageProps {
  params: Promise<{ locale: string }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [t, sp] = await Promise.all([
    getTranslations('account.signUp'),
    searchParams,
  ])

  const isCheckout = getIsCheckoutServer(sp)

  return (
    <AuthPageGuard>
      <StandardContainer className='py-4 pb-16'>
        <div className='mx-auto mt-2 flex w-full max-w-md flex-col items-start px-3 sm:px-6'>
          <div className='flex w-full flex-col items-center'>
            <Link
              href={isCheckout ? '/checkout' : '/sign-in'}
              className='mb-5 flex items-center gap-4 text-sm text-gray-700 underline'
            >
              <ChevronLeftIcon className='size-6' />
              {t(isCheckout ? 'backToCheckout' : 'backToSignIn')}
            </Link>
          </div>
        </div>
        <div className='h-px w-full border-t border-gray-200' />
        <div className='mx-auto mt-12 flex w-full max-w-md flex-col items-start px-3 sm:px-6'>
          <h1 className='mb-6 w-full text-center text-2xl/[1.1] font-normal text-gray-950 sm:text-left'>
            {t('title')}
          </h1>
          <SignUpFormWithRedirect />
        </div>
      </StandardContainer>
    </AuthPageGuard>
  )
}
