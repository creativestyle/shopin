'use client'

import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'

export function PaymentDemo() {
  const params = useParams()
  const locale = useLocale()
  const paymentId = params?.paymentId as string

  const handlePayNow = () => {
    // Redirect to success callback page which will handle order creation
    window.location.href = `/${locale}/checkout/payment/success?paymentId=${paymentId}`
  }

  const handlePaymentFailure = () => {
    // Redirect to failure callback page which will handle error display
    window.location.href = `/${locale}/checkout/payment/failure?paymentId=${paymentId}`
  }

  return (
    <div className='w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
      <div className='mb-6 text-center'>
        <h1 className='mb-2 text-2xl font-bold text-gray-950'>
          Demo Payment Provider
        </h1>
        <p className='text-sm text-gray-600'>
          This is a demo payment page. Choose an option to simulate payment.{' '}
          {paymentId}
        </p>
      </div>

      <div className='flex flex-col gap-4'>
        <button
          type='button'
          onClick={handlePayNow}
          className='inline-flex h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[40px] px-[30px] text-sm font-bold leading-tight text-white transition-all duration-200 bg-rose-700 hover:bg-rose-600 active:bg-rose-600 outline-none disabled:pointer-events-none disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-300 w-full'
        >
          Pay Now
        </button>
        <button
          type='button'
          onClick={handlePaymentFailure}
          className='inline-flex h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[40px] border-2 border-gray-950 bg-white px-[30px] text-sm font-bold leading-tight text-gray-950 transition-all duration-200 hover:bg-gray-50 active:bg-gray-50 outline-none disabled:pointer-events-none disabled:cursor-default disabled:border-gray-300 disabled:bg-transparent disabled:text-gray-300 w-full'
        >
          Simulate Failed Payment
        </button>
      </div>
    </div>
  )
}
