import { getTranslations } from 'next-intl/server'
import { initRouteContext } from '@/lib/request-context/route-context'
import { Link } from '@/lib/navigation'
import { SignUpFormWithRedirect } from './sign-up-form-with-redirect'
import ChevronLeftIcon from '@/public/icons/chevron-left.svg'
import { AuthPageGuard } from '../auth-page-guard'
import { getReturnToServer, setReturnTo } from '@/lib/return-to'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ variant: string; locale: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { variant, locale } = await params
  const resolvedSearchParams = await searchParams
  initRouteContext({ variant, locale })
  const t = await getTranslations('account.signUp')

  const returnTo = getReturnToServer(resolvedSearchParams)
  const isCheckout = !!returnTo?.startsWith('/checkout')

  const signInParams = new URLSearchParams()
  setReturnTo(signInParams, returnTo)
  const signInQuery = signInParams.toString()
  const backHref =
    isCheckout && returnTo
      ? returnTo
      : `/sign-in${signInQuery ? `?${signInQuery}` : ''}`

  return (
    <AuthPageGuard>
      <StandardContainer className='py-4 pb-16'>
        <div className='mx-auto mt-2 flex w-full max-w-md flex-col items-start px-3 sm:px-6'>
          <div className='flex w-full flex-col items-center'>
            <Link
              href={backHref}
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
