'use client'

import { useSelectedLayoutSegments } from 'next/navigation'
import { DemoDisclaimerModal } from '@demo/demo-disclaimer'

const LEGAL_SEGMENTS = new Set(['privacy', 'imprint', 'terms'])

export function DemoDisclaimerModalWrapper() {
  const segments = useSelectedLayoutSegments()
  // useSelectedLayoutSegments includes route groups (e.g. "(main)") — skip them
  const firstSegment = segments.find((s) => !s.startsWith('('))
  if (firstSegment && LEGAL_SEGMENTS.has(firstSegment)) {
    return null
  }
  return <DemoDisclaimerModal />
}
