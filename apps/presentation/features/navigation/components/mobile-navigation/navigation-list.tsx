'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LinkResponse, SubcategoryLink } from '@core/contracts/core/link'
import { NavigationFooter } from './navigation-footer'
import { NavigationItem } from './navigation-item'

type NavigationItemType = LinkResponse | SubcategoryLink

interface NavigationListProps extends React.ComponentProps<'div'> {
  className: string
  items: NavigationItemType[]
  onItemSelect?: (item: NavigationItemType) => void
  onLinkClick: () => void
  viewAllHref?: string
  viewAllLabel?: string
  showFooter?: boolean
}

export function NavigationList({
  className,
  items,
  onItemSelect,
  onLinkClick,
  viewAllHref,
  viewAllLabel,
  showFooter = false,
  ...props
}: NavigationListProps) {
  return (
    <div
      className={cn(
        'no-scrollbar h-full w-full overflow-y-auto',
        {
          'flex flex-col': showFooter,
        },
        className
      )}
      {...props}
    >
      <div className={cn('px-3 pt-4', { 'flex-1': showFooter })}>
        <ul>
          {viewAllHref && viewAllLabel && (
            <li className='border-b border-gray-100'>
              <Link
                className='flex h-11 w-full cursor-pointer items-center lord-of-the-focus-ring text-base font-normal text-gray-700'
                href={viewAllHref}
                onClick={onLinkClick}
              >
                {viewAllLabel}
              </Link>
            </li>
          )}
          {items.map((item) => (
            <li
              className='border-b border-gray-100'
              key={item.href}
            >
              <NavigationItem
                item={item}
                onItemSelect={onItemSelect}
                onLinkClick={onLinkClick}
              />
            </li>
          ))}
        </ul>
      </div>

      {showFooter && <NavigationFooter onLinkClick={onLinkClick} />}
    </div>
  )
}
