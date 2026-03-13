'use client'

import Link from 'next/link'
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import type { ThirdLevelLink } from '@core/contracts/core/link'
import ChevronRightIcon from '@/public/icons/chevronright.svg'

interface NavigationAccordionItemProps {
  item: ThirdLevelLink
  onLinkClick: () => void
}

export function NavigationAccordionItem({
  item,
  onLinkClick,
}: NavigationAccordionItemProps) {
  if (item.children && item.children.length > 0) {
    return (
      <AccordionItem
        key={item.href}
        value={item.href}
      >
        <AccordionTrigger
          className='group/trigger h-11 cursor-pointer items-center gap-2 px-0 py-0 text-base font-normal text-gray-700 normal-case hover:no-underline'
          withArrow={false}
        >
          {item.text}
          <ChevronRightIcon
            className='ml-auto size-6 rotate-90 text-gray-700 transition-all group-data-[state=open]/trigger:rotate-[270deg]'
            aria-hidden='true'
          />
        </AccordionTrigger>
        <AccordionContent className='px-3 pb-0'>
          <ul>
            {item.children.map((child) => (
              <li
                key={child.href}
                className='border-b border-gray-100 first:border-t last:border-0'
              >
                <Link
                  className='flex h-11 w-full items-center lord-of-the-focus-ring text-base font-normal text-gray-700'
                  href={child.href}
                  onClick={onLinkClick}
                >
                  {child.text}
                </Link>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <Link
      className='flex h-11 w-full cursor-pointer items-center lord-of-the-focus-ring text-base font-normal text-gray-700'
      key={item.href}
      href={item.href}
      onClick={onLinkClick}
    >
      {item.text}
    </Link>
  )
}
