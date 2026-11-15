'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { contentImageLoader } from '../lib/content-image-loader'
import PlayIcon from '@/public/icons/play.svg'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'

interface LazyVideoProps {
  src: string
  poster?: string
  captionsUrl?: string
  title?: string
  autoPlay?: boolean
  controls?: boolean
  eager?: boolean
  className?: string
  aspectRatio?: string
}

type PlaybackStatus = 'idle' | 'loading' | 'playing'

export function LazyVideo({
  src,
  poster,
  captionsUrl,
  title,
  autoPlay = false,
  controls = false,
  eager = false,
  className,
  aspectRatio = '16 / 9',
}: LazyVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)
  const [inView, setInView] = useState(eager)
  const [frameReady, setFrameReady] = useState(false)
  const [error, setError] = useState(false)
  const [status, setStatus] = useState<PlaybackStatus>('idle')
  const t = useTranslations('teaser')
  const locale = useLocale()

  const handlePlayClick = () => {
    setInView(true)
    setStatus('loading')
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
    if (status === 'loading' && inView) {
      ref.current?.play().catch(() => setStatus('idle'))
    }
  }, [status, inView])

  const showPlayButton = !autoPlay && status === 'idle'
  const showPoster = !!poster && status !== 'playing'
  const showSkeleton = !poster && !frameReady && !error

  return (
    <div
      className='relative w-full overflow-hidden rounded-lg'
      style={{ aspectRatio }}
    >
      {showSkeleton && (
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
            muted={autoPlay}
            loop={autoPlay}
            controls={controls || (!autoPlay && status !== 'idle')}
            preload={autoPlay || !poster ? 'metadata' : 'none'}
            playsInline
            crossOrigin={captionsUrl ? 'anonymous' : undefined}
            onLoadedData={() => setFrameReady(true)}
            onPlaying={() => setStatus('playing')}
            onError={() => setError(true)}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              className
            )}
          >
            {captionsUrl && (
              <track
                kind='captions'
                src={captionsUrl}
                srcLang={locale}
                label={t('video.captions')}
              />
            )}
          </video>
          {showPoster && (
            <Image
              loader={contentImageLoader}
              src={poster}
              alt=''
              fill
              className='pointer-events-none object-cover'
              sizes='(min-width: 1920px) 1920px, 100vw'
              preload={eager}
              fetchPriority={eager ? 'high' : 'low'}
            />
          )}
          {showPlayButton && (
            <button
              type='button'
              className='absolute inset-0 flex cursor-pointer items-center justify-center'
              onClick={handlePlayClick}
              aria-label={
                title ? t('video.playTitled', { title }) : t('video.play')
              }
            >
              <span className='flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm'>
                <PlayIcon
                  className='h-7 w-7'
                  aria-hidden='true'
                />
              </span>
            </button>
          )}
        </>
      )}
    </div>
  )
}
