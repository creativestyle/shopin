import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  src: string
  className?: string
  alt?: string
  width?: number
  height?: number
}

export const Logo: React.FC<LogoProps> = ({
  src,
  className,
  alt,
  width,
  height,
  ...props
}) => {
  return (
    <div
      className={cn('relative', className)}
      {...props}
    >
      <Link
        href='/'
        className='relative flex h-full w-full items-center justify-center transition-opacity outline-none hover:opacity-80 focus-visible:inset-ring-1 focus-visible:inset-ring-black/20'
      >
        <Image
          src={src}
          alt={alt || 'Logo'}
          width={width || 165}
          height={height || 146}
          className='h-full w-auto object-contain'
          preload
          loading='eager'
          fetchPriority='high'
        />
      </Link>
    </div>
  )
}
