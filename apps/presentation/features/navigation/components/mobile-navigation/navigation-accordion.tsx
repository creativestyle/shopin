'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Accordion } from '@/components/ui/accordion'
import type { SubcategoryLink } from '@core/contracts/core/link'
import { NavigationAccordionItem } from './navigation-accordion-item'

interface NavigationAccordionProps extends React.ComponentProps<'div'> {
  className: string
  subcategory?: SubcategoryLink
  onBackClick: () => void
  onLinkClick: () => void
}

export function NavigationAccordion({
  className,
  subcategory,
  onBackClick,
  onLinkClick,
  ...props
}: NavigationAccordionProps) {
  const t = useTranslations('common')

  return (
    <div
      className={cn('no-scrollbar h-full w-full overflow-y-auto', className)}
      {...props}
    >
      <div className='px-3 pt-4'>
        <ul>
          <li className='border-b border-gray-100'>
            <Link
              className='flex h-11 w-full cursor-pointer items-center lord-of-the-focus-ring text-base font-normal text-gray-700'
              href={subcategory?.href ?? ''}
              onClick={onLinkClick}
            >
              {t('viewAll')}
            </Link>
          </li>
        </ul>
        <Accordion type='multiple'>
          {subcategory?.children?.map((item) => (
            <li
              className='list-none border-b border-gray-100'
              key={item.href}
            >
              <NavigationAccordionItem
                item={item}
                onLinkClick={onLinkClick}
              />
            </li>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
