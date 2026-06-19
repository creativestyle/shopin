'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { contentImageLoader } from '../lib/content-image-loader'
import PlayIcon from '@/public/icons/play.svg'
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
  const [playing, setPlaying] = useState(false)
  const t = useTranslations('teaser')

  const handlePosterClick = () => {
    setInView(true)
    setPlaying(true)
  }

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

  useEffect(() => {
    if (playing && inView) {
      ref.current?.play().catch(() => {})
    }
  }, [playing, inView])

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
        <>
          <video
            ref={ref}
            src={inView ? src : undefined}
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
          {poster && !autoPlay && !playing && (
            <button
              type='button'
              className='absolute inset-0 cursor-pointer'
              onClick={handlePosterClick}
              aria-label={t('video.play')}
            >
              <Image
                loader={contentImageLoader}
                src={poster}
                alt=''
                fill
                className='object-cover'
                sizes='(min-width: 1920px) 1920px, 100vw'
                priority={eager}
                fetchPriority={eager ? 'high' : 'low'}
              />
              <span className='absolute inset-0 flex items-center justify-center'>
                <span className='flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm'>
                  <PlayIcon
                    className='h-7 w-7'
                    aria-hidden='true'
                  />
                </span>
              </span>
            </button>
          )}
        </>
      )}
    </div>
  )
}
