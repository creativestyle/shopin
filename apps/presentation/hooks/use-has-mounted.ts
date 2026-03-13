'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/**
 * True after the component has mounted on the client. Use to avoid hydration
 * mismatch when rendering client-only UI (e.g. Radix components that generate
 * different IDs on server vs client).
 *
 * Uses React's recommended pattern: useSyncExternalStore. During SSR and
 * hydration React uses getServerSnapshot (false); on the client it uses
 * getClientSnapshot (true). No effect, no setState, no lint issues.
 * https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  )
}
