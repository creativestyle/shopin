'use client'

import React, { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import CloseIcon from '@/public/icons/close.svg'
import { Carousel, CarouselSlide } from '@/components/ui/carousel'
import type { CarouselRef } from '@/types/carousel'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export interface GalleryImage {
  src: string
  alt?: string
}

export interface GalleryDialogProps {
  images: GalleryImage[]
  startIndex?: number
  isOpen: boolean
  onClose: () => void
  /** Image width in pixels (default: 1200) */
  imageWidth?: number
  /** Image height in pixels (default: 1200) */
  imageHeight?: number
}

const DEFAULT_IMAGE_SIZE = 1200

export const GalleryDialog: React.FC<GalleryDialogProps> = ({
  images,
  startIndex = 0,
  isOpen,
  onClose,
  imageWidth = DEFAULT_IMAGE_SIZE,
  imageHeight = DEFAULT_IMAGE_SIZE,
}) => {
  const t = useTranslations('product.gallery')
  const carouselRef = useRef<CarouselRef>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Scroll to startIndex when dialog opens or startIndex changes
  // Uses requestAnimationFrame to wait for slides to be rendered before scrolling
  // This is necessary because the carousel uses progressive rendering
  useEffect(() => {
    if (!isOpen || startIndex < 0) {
      return
    }

    // Cancel any pending animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    const attemptScroll = () => {
      if (!carouselRef.current) {
        animationFrameRef.current = requestAnimationFrame(attemptScroll)
        return
      }

      animationFrameRef.current = null
      carouselRef.current.scrollToSlide(startIndex)
    }

    animationFrameRef.current = requestAnimationFrame(attemptScroll)

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isOpen, startIndex])

  const carouselSlides = images.map((item, idx) => {
    const isStartImage = idx === startIndex
    return (
      <CarouselSlide
        key={idx}
        className='flex min-h-full items-center justify-center'
      >
        <div className='flex h-full max-h-screen w-full items-center justify-center p-4'>
          <Image
            src={item.src}
            alt={item.alt || ''}
            width={imageWidth}
            height={imageHeight}
            preload={isStartImage}
            loading={isStartImage ? 'eager' : 'lazy'}
            fetchPriority={isStartImage ? 'high' : undefined}
            className='h-auto max-h-[calc(100vh-2rem)] w-auto max-w-full object-contain'
          />
        </div>
      </CarouselSlide>
    )
  })

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent
        className='inset-0 top-0 right-0 bottom-0 left-0 h-screen max-h-screen w-full max-w-full translate-x-0 translate-y-0 transform-none overflow-hidden rounded-none md:inset-0 md:top-0 md:right-0 md:bottom-0 md:left-0 md:h-screen md:max-h-screen md:w-full md:max-w-full md:translate-x-0 md:translate-y-0 md:transform-none md:rounded-none'
        showCloseButton={false}
      >
        <DialogTitle className='sr-only'>{t('dialogTitle')}</DialogTitle>
        <DialogDescription className='sr-only'>
          {t('dialogDescription')}
        </DialogDescription>
        <button
          type='button'
          className='absolute top-4 right-4 z-10 rounded-full bg-white/90 p-2 shadow-sm hover:bg-white'
          onClick={onClose}
          aria-label='Close lightbox'
        >
          <CloseIcon className='size-5' />
        </button>
        <div className='flex h-full w-full flex-1 [&_[data-role=carousel]]:h-full [&_[data-role=carousel]_[role=group]]:h-full [&_[data-role=carousel]_div[role=group]]:h-full [&_[data-role=carousel]>div]:h-full [&_button[type=button]]:opacity-100'>
          <Carousel
            ref={carouselRef}
            gridConfig={1}
            navigation={images.length > 1}
            scrollbar={false}
            className='h-full w-full flex-1'
          >
            {carouselSlides}
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  )
}
