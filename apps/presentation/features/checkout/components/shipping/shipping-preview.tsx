'use client'

import { useCart } from '@/features/cart/cart-use-cart'
import { useFormatAddressLines } from '@/features/address/use-format-address-lines'

export function ShippingPreview() {
  const { cart } = useCart()

  // Format address lines using the shared utility
  const addressLines = useFormatAddressLines(cart?.shippingAddress)

  if (addressLines.length === 0) {
    return null
  }

  return (
    <div className='space-y-1 text-sm text-gray-700'>
      {addressLines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </div>
  )
}
