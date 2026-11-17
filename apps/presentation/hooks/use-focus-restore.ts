'use client'

import * as React from 'react'

type AutoFocusHandler = (event: Event) => void

/** Restores focus to the opener (explicit ref, else activeElement at open) when a Radix Dialog/Sheet closes. */
export function useFocusRestore(
  openerRef?: React.RefObject<HTMLElement | null>,
  handlers: {
    onOpenAutoFocus?: AutoFocusHandler
    onCloseAutoFocus?: AutoFocusHandler
  } = {}
) {
  const { onOpenAutoFocus: onOpen, onCloseAutoFocus: onClose } = handlers
  const triggerRef = React.useRef<HTMLElement | null>(null)

  const onOpenAutoFocus = React.useCallback(
    (event: Event) => {
      onOpen?.(event)
      const active = document.activeElement as HTMLElement | null
      triggerRef.current =
        openerRef?.current ??
        (active && active !== document.body ? active : null)
    },
    [openerRef, onOpen]
  )

  const onCloseAutoFocus = React.useCallback(
    (event: Event) => {
      onClose?.(event)
      const target = triggerRef.current
      if (event.defaultPrevented || !target || !document.contains(target)) {
        return
      }
      target.focus({ preventScroll: true })
      // Keep Radix's default restore unless ours actually landed.
      if (document.activeElement === target) {
        event.preventDefault()
      }
    },
    [onClose]
  )

  return { onOpenAutoFocus, onCloseAutoFocus }
}
