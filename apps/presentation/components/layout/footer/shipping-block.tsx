import type { FooterShipping } from '@core/contracts/content/layout'

export function ShippingBlock({ shipping }: { shipping: FooterShipping }) {
  return (
    <div className='space-y-4'>
      {shipping.title && (
        <h3 className='text-sm leading-tight font-bold text-gray-900'>
          {shipping.title}
        </h3>
      )}
      <div className='flex gap-2'>
        {shipping.items.map((item, i) => (
          <div
            key={i}
            className='flex h-12 min-w-20 flex-col items-center justify-center rounded-md border border-yellow-500 bg-yellow-400 px-2 shadow-sm'
          >
            <span className='text-xs font-bold text-gray-900'>
              {item.label}
            </span>
            {item.subLabel && (
              <span className='text-xs text-gray-700'>{item.subLabel}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
