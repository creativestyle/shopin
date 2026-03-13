'use client'

import Link from 'next/link'
import ChevronLeftIcon from '@/public/icons/chevronleft.svg'

interface CheckoutBackLinkProps {
  label: string
}

export function CheckoutBackLink({ label }: CheckoutBackLinkProps) {
  return (
    <Link
      href='/cart'
      className='flex items-center gap-4 text-sm text-gray-700 underline transition-colors hover:text-gray-900'
    >
      <ChevronLeftIcon className='size-6' />
      {label}
    </Link>
  )
}
