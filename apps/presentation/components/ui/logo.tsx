import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface LogoProps {
  src: string
  className?: string
  alt?: string
  linkAriaLabel?: string
  preload?: boolean
}

export const Logo: React.FC<LogoProps> = ({
  src,
  className,
  alt,
  linkAriaLabel,
  preload,
}) => {
  const t = useTranslations('common')
  const resolvedAlt = alt || t('logoAlt')
  const resolvedLinkAriaLabel = linkAriaLabel || t('logoHomeLink')

  return (
    <div className={cn('relative', className)}>
      <Link
        href='/'
        aria-label={resolvedLinkAriaLabel}
        className='relative flex h-full w-full items-center justify-center transition-opacity outline-none hover:opacity-80 focus-visible:inset-ring-1 focus-visible:inset-ring-black/20'
      >
        <Image
          src={src}
          alt={resolvedAlt}
          fill
          sizes='200px'
          className='object-contain'
          {...(preload
            ? { preload: true, fetchPriority: 'high' as const }
            : {})}
        />
      </Link>
    </div>
  )
}
