import React from 'react'
import { cn } from '@/lib/utils'

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
  return <main className={cn('flex-1', className)}>{children}</main>
}
