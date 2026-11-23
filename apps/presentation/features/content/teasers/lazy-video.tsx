'use client'

import { useRef, useState, useEffect, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { contentImageLoader } from '../lib/content-image-loader'
import PlayIcon from '@/public/icons/play.svg'
import PauseIcon from '@/public/icons/pause.svg'
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

type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia?.(REDUCED_MOTION_QUERY)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

function matchesReducedMotion() {
  return window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    matchesReducedMotion,
    () => false
  )
}

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
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const reducedMotion = usePrefersReducedMotion()
  const t = useTranslations('teaser')
  const locale = useLocale()

  // Ambient mode: muted loop that starts on its own; otherwise click-to-play
  const ambient = autoPlay && !reducedMotion && !autoplayBlocked

  const handlePlayClick = () => {
    setInView(true)
    setStatus('loading')
  }

  const handleToggleClick = () => {
    const el = ref.current
    if (!el) {
      return
    }
    if (el.paused) {
      el.play().catch(() => setStatus('paused'))
    } else {
      el.pause()
    }
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
    const el = ref.current
    if (!inView || !el) {
      return
    }
    // Hydration still sees the server snapshot, so read the media query directly
    const autoplayNow = ambient && status === 'idle' && !matchesReducedMotion()
    if (status === 'loading' || autoplayNow) {
      el.play().catch(() => {
        setStatus('idle')
        if (ambient) {
          setAutoplayBlocked(true)
        }
      })
    }
  }, [status, inView, ambient])

  const showPlayButton = !ambient && status === 'idle'
  const showToggle = ambient && !controls
  const showPoster = !!poster && (status === 'idle' || status === 'loading')
  const showSkeleton = !poster && !frameReady && !error
  const isPlaying = status === 'playing'

  return (
    <div
      // Above a sibling overlay link once the shopper has to click to play
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        !ambient && 'z-20'
      )}
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
            muted={autoPlay}
            loop={autoPlay}
            controls={controls || (!ambient && status !== 'idle')}
            preload={ambient || !poster ? 'metadata' : 'none'}
            playsInline
            // Captions track needs CORS, so video and .vtt hosts must send Access-Control-Allow-Origin
            crossOrigin={captionsUrl ? 'anonymous' : undefined}
            onLoadedData={() => setFrameReady(true)}
            onPlaying={() => setStatus('playing')}
            onPause={() =>
              setStatus((current) =>
                current === 'playing' ? 'paused' : current
              )
            }
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
          {showToggle && (
            <button
              type='button'
              className='absolute right-3 bottom-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm'
              onClick={handleToggleClick}
              aria-label={isPlaying ? t('video.pause') : t('video.play')}
            >
              {isPlaying ? (
                <PauseIcon
                  className='h-5 w-5'
                  aria-hidden='true'
                />
              ) : (
                <PlayIcon
                  className='h-5 w-5'
                  aria-hidden='true'
                />
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
