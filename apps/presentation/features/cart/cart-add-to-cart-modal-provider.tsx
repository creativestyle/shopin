'use client'

import * as React from 'react'
import { createContext, useContext, useState } from 'react'
import { AddToCartModal } from './components/add-to-cart-modal'

interface AddToCartModalContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const AddToCartModalContext = createContext<
  AddToCartModalContextType | undefined
>(undefined)

export function AddToCartModalProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <AddToCartModalContext.Provider value={{ open, setOpen }}>
      {children}
      <AddToCartModal
        open={open}
        onOpenChange={setOpen}
      />
    </AddToCartModalContext.Provider>
  )
}

export function useAddToCartModal() {
  const context = useContext(AddToCartModalContext)
  if (context === undefined) {
    throw new Error(
      'useAddToCartModal must be used within an AddToCartModalProvider'
    )
  }
  return context
}
