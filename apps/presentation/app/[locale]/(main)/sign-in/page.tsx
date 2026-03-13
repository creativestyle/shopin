import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { LoginForm } from '@/features/auth/auth-login-form'
import { AuthPageGuard } from '../auth-page-guard'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function SignInPage() {
  const t = await getTranslations('account.signIn')

  return (
    <AuthPageGuard>
      <StandardContainer className='py-4 pb-16'>
        <div className='mx-auto mt-10 flex w-full max-w-md flex-col items-start px-3 sm:px-6'>
          <h1 className='mb-6 w-full text-center text-2xl/[1.1] font-normal text-gray-950 sm:text-left'>
            {t('title')}
          </h1>
          <p className='mb-6 w-full text-center text-base/[1.6] font-normal text-gray-700 sm:text-left'>
            {t('description')}
          </p>
          <div className='w-full'>
            <LoginForm />
          </div>
        </div>
        <div className='mt-8 h-px w-full border-t border-gray-200' />
        <div className='mx-auto mt-6 flex w-full max-w-md flex-col items-center px-3 sm:px-6'>
          <div className='text-center text-sm text-gray-700'>
            <span>{t('noAccount')} </span>
            <Link
              href={`/sign-up`}
              className='underline hover:text-gray-950'
            >
              {t('signUp')}
            </Link>
          </div>
        </div>
      </StandardContainer>
    </AuthPageGuard>
  )
}
