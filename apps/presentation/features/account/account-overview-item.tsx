import Link from 'next/link'
import { FC, PropsWithChildren } from 'react'
import ChevronRightIcon from '@/public/icons/chevronright.svg'
import { IconComponent } from './lib/account-navigation-items'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AccountOverviewItemProps {
  label: string
  description?: string
  href: string
  icon: IconComponent
  className?: string
}

export const AccountOverviewItem: FC<
  PropsWithChildren<AccountOverviewItemProps>
> = ({ label, description, href, icon: Icon, className, children }) => {
  return (
    <Card
      scheme='gray'
      className={cn('p-0', className)}
    >
      <Link
        href={href}
        className='group flex items-center gap-6 p-4 text-gray-700 lg:p-7'
      >
        <span className='block rounded-full bg-gray-900 p-2 transition-colors group-hover:bg-primary lg:p-4'>
          <Icon
            className='size-6 text-white'
            aria-hidden='true'
          />
        </span>

        <span className='block w-full'>
          <span className='flex items-center font-bold transition-colors max-lg:justify-between'>
            <span className='group-hover:text-primary'>{label}</span>
            <ChevronRightIcon className='size-6' />
          </span>
          {description && (
            <span className='mt-2 hidden text-sm text-gray-500 lg:block'>
              {description}
            </span>
          )}
        </span>
      </Link>
      {children}
    </Card>
  )
}
