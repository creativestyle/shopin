'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import ChevronDownIcon from '@/public/icons/chevron-down.svg'

interface ShowMoreProductsProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  sentinelRef: React.RefObject<HTMLDivElement | null>
}

export function ShowMoreProducts({
  scrollRef,
  sentinelRef,
}: ShowMoreProductsProps) {
  const t = useTranslations('cart')
  const [showMoreProducts, setShowMoreProducts] = React.useState(false)
  const [isScrolledToBottom, setIsScrolledToBottom] = React.useState(false)
  const [hasScrollableContent, setHasScrollableContent] = React.useState(false)

  React.useEffect(() => {
    if (!scrollRef.current || !sentinelRef.current) {
      setIsScrolledToBottom(false)
      setHasScrollableContent(false)
      return
    }

    const scrollElement = scrollRef.current
    const sentinelElement = sentinelRef.current
    let isMounted = true

    const checkScrollability = () => {
      if (!isMounted) {
        return
      }
      const isScrollable =
        scrollElement.scrollHeight > scrollElement.clientHeight
      setHasScrollableContent(isScrollable)
    }

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (!isMounted) {
          return
        }
        const isVisible = entries[0]?.isIntersecting ?? false
        setIsScrolledToBottom(isVisible)
        checkScrollability()
      },
      {
        root: scrollElement,
        rootMargin: '0px',
        threshold: 0,
      }
    )

    intersectionObserver.observe(sentinelElement)

    const resizeObserver = new ResizeObserver(() => {
      checkScrollability()
    })
    resizeObserver.observe(scrollElement)

    checkScrollability()

    return () => {
      isMounted = false
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
    }
  }, [scrollRef, sentinelRef])

  if (!hasScrollableContent || isScrolledToBottom) {
    return null
  }

  return (
    <div className='flex w-full shrink-0 flex-col items-start gap-2.5 p-2'>
      <div className='flex w-full shrink-0 flex-col items-center gap-2 rounded-lg bg-gray-50 px-0 py-3'>
        <button
          type='button'
          onClick={() => {
            setShowMoreProducts(!showMoreProducts)
            if (scrollRef.current) {
              scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth',
              })
            }
          }}
          className='flex cursor-pointer items-center gap-2 p-0'
          aria-expanded={showMoreProducts}
        >
          <span className='text-sm/[1.6] font-normal whitespace-pre text-gray-700 underline decoration-solid'>
            {t('addToCartModal.moreProducts')}
          </span>
          <ChevronDownIcon className='h-6 w-6 shrink-0 text-gray-700' />
        </button>
      </div>
    </div>
  )
}
