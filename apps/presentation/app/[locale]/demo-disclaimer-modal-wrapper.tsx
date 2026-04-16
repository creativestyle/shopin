'use client'

import { useRouter } from 'next/navigation'
import { DemoDisclaimerModal } from '@demo/demo-disclaimer'

export function DemoDisclaimerModalWrapper() {
  const router = useRouter()
  return <DemoDisclaimerModal onNavigate={(href) => router.push(href)} />
}
