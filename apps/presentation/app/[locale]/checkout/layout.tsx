import React from 'react'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Parent layout just passes through - each route group has its own layout
  return <>{children}</>
}
