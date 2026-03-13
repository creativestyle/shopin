'use client'

import { useCart } from './cart-use-cart'

interface CartTitleCountProps {
  titleBase: string
}

export function CartTitleCount({ titleBase }: CartTitleCountProps) {
  const { cart, isLoading, error } = useCart()
  const count = cart?.itemCount ?? 0

  if (isLoading || error) {
    return <>{titleBase}</>
  }

  return (
    <>
      {titleBase} ({count})
    </>
  )
}
