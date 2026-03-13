import type { FooterPaymentMethods } from '@core/contracts/content/layout'

export function PaymentMethodsBlock({
  paymentMethods,
}: {
  paymentMethods: FooterPaymentMethods
}) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm/[1.6] font-bold text-gray-900'>
        {paymentMethods.title}
      </h3>
      <div className='flex flex-wrap gap-2'>
        {paymentMethods.methods.map((method, i) => (
          <div
            key={i}
            className='flex h-12 items-center justify-center rounded-lg border border-gray-300 bg-transparent px-3 py-2 shadow-sm transition-colors hover:border-gray-400'
          >
            <span className='text-sm leading-normal font-normal text-gray-900'>
              {method}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
