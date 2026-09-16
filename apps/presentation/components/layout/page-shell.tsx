import React from 'react'
import { cn } from '@/lib/utils'

/** Target of the global skip-to-content link. */
export const MAIN_CONTENT_ID = 'main-content'

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('flex flex-1 flex-col', className)}>{children}</div>
}

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className={cn('flex-1 outline-none', className)}
    >
      {children}
    </main>
  )
}
