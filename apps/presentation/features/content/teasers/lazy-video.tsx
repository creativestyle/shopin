'use client'

import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface LazyVideoProps {
  src?: string
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  controls?: boolean
  eager?: boolean
  className?: string
  aspectRatio?: string
}

export function LazyVideo({
  src,
  poster,
  autoPlay,
  muted,
  controls = false,
  eager = false,
  className,
  aspectRatio = '16 / 9',
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(eager)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const t = useTranslations('teaser')

  useEffect(() => {
    if (inView) {
      return
    }
    const el = ref.current
    if (!el) {
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])

  return (
    <div
      className='relative w-full overflow-hidden rounded-lg'
      style={{ aspectRatio }}
    >
      {!loaded && !error && (
        <div className='absolute inset-0 animate-pulse bg-gray-200' />
      )}
      {error && (
        <div className='absolute inset-0 flex items-center justify-center bg-gray-100 text-sm text-gray-500'>
          {t('video.unavailable')}
        </div>
      )}
      {!error && (
        <video
          ref={ref}
          src={inView ? src : undefined}
          poster={poster}
          autoPlay={autoPlay}
          muted={muted}
          loop={autoPlay}
          controls={controls}
          preload='none'
          playsInline={autoPlay && muted}
          onCanPlay={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            className
          )}
        />
      )}
    </div>
  )
}
