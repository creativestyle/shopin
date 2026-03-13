'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { HorizontalScroller } from '@/components/ui/horizontal-scroller'
import type { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import type { LinkResponse } from '@core/contracts/core/link'

interface MainNavigationProps extends MainNavigationResponse {
  className?: string
}

const ENTER_TIMEOUT = 200
const LEAVE_TIMEOUT = 150

export const MainNavigation: React.FC<MainNavigationProps> = ({
  items,
  className,
}) => {
  const [activeItem, setActiveItem] = React.useState<LinkResponse | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const [dropdownTop, setDropdownTop] = React.useState(0)
  const navRef = React.useRef<HTMLDivElement>(null)
  const enterTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const leaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const handleMouseEnter = (item: LinkResponse) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
    }

    if (activeItem) {
      // If already showing a dropdown, switch immediately
      setActiveItem(item)
      return
    }

    enterTimeoutRef.current = setTimeout(() => {
      setActiveItem(item)
      // Calculate dropdown position
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect()
        setDropdownTop(rect.bottom + window.scrollY)
      }
    }, ENTER_TIMEOUT)
  }

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current)
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setActiveItem(null)
    }, LEAVE_TIMEOUT)
  }

  const handleDropdownMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }
  }

  React.useEffect(() => {
    setMounted(true)
    return () => {
      if (enterTimeoutRef.current) {
        clearTimeout(enterTimeoutRef.current)
      }
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
      }
    }
  }, [])

  const hasActiveDropdown =
    activeItem && activeItem.children && activeItem.children.length > 0

  return (
    <div
      ref={navRef}
      className={cn(
        'relative flex h-full min-w-0 flex-1 items-stretch',
        className
      )}
      onMouseLeave={handleMouseLeave}
    >
      <HorizontalScroller className='h-full min-w-0 flex-1 [&>div]:h-full'>
        <nav className='flex h-full flex-row items-stretch justify-start gap-8 lg:gap-6'>
          {items.map((item) => (
            <div
              key={item.href}
              className='relative flex h-full items-center'
              onMouseEnter={() => handleMouseEnter(item)}
            >
              {/* Navigation text */}
              <Link
                href={item.href}
                className={cn(
                  'text-center text-base leading-normal font-normal whitespace-nowrap',
                  {
                    'text-red-400': item.isHighlighted,
                    'text-gray-700': !item.isHighlighted,
                  }
                )}
              >
                {item.text}
              </Link>

              {/* Active indicator - at the very bottom */}
              <div
                className={cn(
                  'absolute right-0 bottom-0 left-0 h-0.5 bg-primary transition-opacity',
                  {
                    'opacity-100': activeItem?.href === item.href,
                    'opacity-0': activeItem?.href !== item.href,
                  }
                )}
              />
            </div>
          ))}
        </nav>
      </HorizontalScroller>
      {/* Dropdown */}
      {hasActiveDropdown &&
        mounted &&
        createPortal(
          <div
            className='absolute inset-x-0 z-50 bg-white shadow-lg'
            style={{ top: `${dropdownTop}px` }}
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className='mx-auto max-w-7xl px-7 py-10'>
              <div className='flex flex-row items-start gap-7 lg:gap-4'>
                {/* Left side - Category columns */}
                <div className='grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] items-start gap-x-7 gap-y-10 lg:gap-x-4 lg:gap-y-8'>
                  {activeItem.children?.map((subcategory) => (
                    <div
                      key={subcategory.href}
                      className='flex flex-col gap-3'
                    >
                      {/* 2nd level - Title */}
                      <Link
                        href={subcategory.href}
                        className='text-base font-semibold text-gray-900 hover:text-primary'
                      >
                        {subcategory.text}
                      </Link>

                      {/* 3rd level - List */}
                      {subcategory.children &&
                        subcategory.children.length > 0 && (
                          <ul className='flex flex-col gap-1'>
                            {subcategory.children.map((child) => (
                              <li key={child.href}>
                                <Link
                                  href={child.href}
                                  className='block py-0.5 text-sm text-gray-600 hover:text-primary'
                                >
                                  {child.text}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  ))}
                </div>

                {/* Right side - Featured product */}
                {activeItem.featuredProduct && (
                  <Link
                    href={`/p/${activeItem.featuredProduct.slug}`}
                    className='ml-auto flex w-full max-w-80 flex-shrink-0 flex-col items-center gap-4 hover:opacity-80'
                  >
                    <div className='relative aspect-square w-full'>
                      <Image
                        src={activeItem.featuredProduct.image.src}
                        alt={activeItem.featuredProduct.image.alt}
                        fill
                        className='object-cover'
                        sizes='320px'
                      />
                    </div>
                    <div className='text-center text-sm font-bold text-gray-900'>
                      {activeItem.featuredProduct.name}
                    </div>
                    <div className='text-center text-base font-bold text-gray-900'>
                      {(
                        (activeItem.featuredProduct.price
                          .discountedPriceInCents ??
                          activeItem.featuredProduct.price
                            .regularPriceInCents) / 100
                      ).toFixed(
                        activeItem.featuredProduct.price.fractionDigits
                      )}{' '}
                      {activeItem.featuredProduct.price.currency}
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
