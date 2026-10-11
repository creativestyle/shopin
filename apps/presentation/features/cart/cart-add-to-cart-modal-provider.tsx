'use client'

import * as React from 'react'
import { createContext, useContext, useRef, useState } from 'react'
import { AddToCartModal } from './components/add-to-cart-modal'

interface AddToCartModalContextType {
  open: boolean
  setOpen: (open: boolean) => void
  setTrigger: (element: HTMLElement | null) => void
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
  const triggerRef = useRef<HTMLElement | null>(null)

  const setTrigger = (element: HTMLElement | null) => {
    triggerRef.current = element
  }

  return (
    <AddToCartModalContext.Provider value={{ open, setOpen, setTrigger }}>
      {children}
      <AddToCartModal
        open={open}
        onOpenChange={setOpen}
        restoreFocusRef={triggerRef}
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
