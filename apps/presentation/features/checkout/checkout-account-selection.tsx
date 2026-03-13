'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LoginForm } from '@/features/auth/auth-login-form'
import { useCustomer } from '@/features/customer/customer-use-customer'
import { setIsCheckoutParam } from './checkout-param-utils'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export function CheckoutAccountSelection() {
  const t = useTranslations('checkout')
  const router = useRouter()
  const { isLoggedIn, isLoading } = useCustomer()

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.push('/checkout/billing', { scroll: false })
    }
  }, [isLoggedIn, isLoading, router])

  function redirectToBilling() {
    router.push('/checkout/billing', { scroll: false })
  }

  function handleCreateAccount() {
    const params = new URLSearchParams()
    setIsCheckoutParam(params)
    router.push(`/sign-up?${params.toString()}`)
  }

  // Show loading state while checking authentication
  if (isLoading || isLoggedIn) {
    return <LoadingSpinner className='size-8 min-h-[70vh]' />
  }

  return (
    <div className='ui-checkout-max-width-container grid w-full grid-cols-1 gap-8 lg:grid-cols-2'>
      {/* Left Column: Login Section */}
      <div className='flex max-w-3xl flex-col items-center'>
        <div className='mb-6 w-full max-w-112'>
          <h2 className='mb-2 text-2xl font-normal text-gray-950'>
            {t('login.title')}
          </h2>
          <p className='text-base/[1.6] font-normal text-gray-700'>
            {t('login.description')}
          </p>
        </div>

        <div className='w-full max-w-112'>
          <LoginForm onSuccess={redirectToBilling} />
        </div>
      </div>

      {/* Right Column: Guest Checkout and Account Creation */}
      <div className='flex max-w-3xl flex-col items-center gap-8'>
        {/* Guest Checkout Section */}
        <div className='w-full max-w-112'>
          <h2 className='mb-2 text-2xl font-normal text-gray-950'>
            {t('guest.title')}
          </h2>
          <p className='mb-6 text-base/[1.6] font-normal text-gray-700'>
            {t('guest.description')}
          </p>
          <Button
            variant='secondary'
            scheme='black'
            className='w-full'
            onClick={redirectToBilling}
          >
            {t('guest.button')}
          </Button>
        </div>

        {/* Create Account Section */}
        <div className='w-full max-w-112'>
          <h2 className='mb-2 text-2xl font-normal text-gray-950'>
            {t('createAccount.title')}
          </h2>
          <p className='mb-6 text-base/[1.6] font-normal text-gray-700'>
            {t('createAccount.description')}
          </p>
          <Button
            variant='primary'
            scheme='red'
            className='w-full'
            onClick={handleCreateAccount}
          >
            {t('createAccount.button')}
          </Button>
        </div>
      </div>
    </div>
  )
}
