'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { LinkResponse, SubcategoryLink } from '@core/contracts/core/link'
import ChevronRightIcon from '@/public/icons/chevronright.svg'

type NavigationItemType = LinkResponse | SubcategoryLink

interface NavigationItemProps {
  item: NavigationItemType
  onItemSelect?: (item: NavigationItemType) => void
  onLinkClick: () => void
}

export function NavigationItem({
  item,
  onItemSelect,
  onLinkClick,
}: NavigationItemProps) {
  const isHighlighted = 'isHighlighted' in item && item.isHighlighted

  if (item.children && item.children.length > 0) {
    return (
      <button
        className={cn(
          'flex h-11 w-full cursor-pointer items-center lord-of-the-focus-ring text-base font-normal',
          {
            'text-red-400': isHighlighted,
            'text-gray-700': !isHighlighted,
          }
        )}
        onClick={() => onItemSelect?.(item)}
      >
        {item.text}
        <ChevronRightIcon
          className='ml-auto size-6 text-gray-700'
          aria-hidden='true'
        />
      </button>
    )
  }

  return (
    <Link
      className={cn(
        'flex h-11 w-full cursor-pointer items-center lord-of-the-focus-ring text-base font-normal',
        {
          'text-red-400': isHighlighted,
          'text-gray-700': !isHighlighted,
        }
      )}
      href={item.href}
      onClick={onLinkClick}
    >
      {item.text}
    </Link>
  )
}
