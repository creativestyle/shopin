'use client'

import * as React from 'react'

// Module-level focus tracker — always active, survives conditionally-mounted dialogs.
let lastFocusedElement: HTMLElement | null = null

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focus',
    (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target !== document.body) {
        lastFocusedElement = e.target
      }
    },
    true
  )
}

/**
 * Focus-restore handlers for Radix Dialog/Sheet Content. Uses a module-level
 * tracker that survives conditionally-mounted dialogs and disabled triggers.
 *
 * @param openerRef - Explicit restore target; the only reliable one when the
 *   opener is disabled mid-request, unmounts with its own dialog, or was tapped
 *   on touch. Falls back to activeElement, then the module-level tracker.
 */
export function useFocusRestore(
  openerRef?: React.RefObject<HTMLElement | null>
) {
  const triggerRef = React.useRef<HTMLElement | null>(null)

  const onOpenAutoFocus = React.useCallback(() => {
    const active = document.activeElement as HTMLElement | null
    triggerRef.current =
      openerRef?.current ??
      (active && active !== document.body ? active : lastFocusedElement)
  }, [openerRef])

  const onCloseAutoFocus = React.useCallback((event: Event) => {
    if (triggerRef.current && document.contains(triggerRef.current)) {
      event.preventDefault()
      triggerRef.current.focus()
    }
  }, [])

  return { onOpenAutoFocus, onCloseAutoFocus }
}
