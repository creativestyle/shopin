'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export interface GalleryImageProps {
  src: string
  alt: string
  onZoom?: () => void
  className?: string
  loading?: 'lazy' | 'eager'
}

export const GalleryImage: React.FC<GalleryImageProps> = ({
  src,
  alt,
  onZoom,
  className,
  loading,
}) => {
  const isInteractive = Boolean(onZoom)

  return (
    <div
      className={cn(
        'relative aspect-square overflow-hidden rounded-lg',
        {
          'group cursor-zoom-in': isInteractive,
        },
        className
      )}
      {...(isInteractive && {
        'role': 'button' as const,
        'tabIndex': 0,
        'aria-label': 'Open image in lightbox',
        'onClick': onZoom,
        'onKeyDown': (e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onZoom?.()
          }
        },
      })}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className='object-contain'
        loading={loading}
      />
    </div>
  )
}
