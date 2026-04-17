'use client'

import { usePathname } from 'next/navigation'
import { DemoDisclaimerModal } from '@demo/demo-disclaimer'

const LEGAL_PATHS = new Set(['/privacy', '/imprint', '/terms'])

export function DemoDisclaimerModalWrapper() {
  const pathname = usePathname()
  const segment = '/' + (pathname.split('/').pop() ?? '')
  if (LEGAL_PATHS.has(segment)) {
    return null
  }
  return <DemoDisclaimerModal />
}
