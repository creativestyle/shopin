'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import HeartIcon from '@/public/icons/heart.svg'
import PinIcon from '@/public/icons/pin.svg'
import AccountIcon from '@/public/icons/account.svg'
import MailIcon from '@/public/icons/mail.svg'
import HelpIcon from '@/public/icons/help.svg'

interface NavigationFooterProps {
  onLinkClick: () => void
}

const footerLinks = [
  { translationKey: 'wishlist', href: '/wishlist', icon: HeartIcon },
  { translationKey: 'stores', href: '/stores', icon: PinIcon },
  { translationKey: 'shopinclub', href: '/shopinclub', icon: AccountIcon },
  { translationKey: 'contact', href: '/contact', icon: MailIcon },
  { translationKey: 'faqHelp', href: '/faq', icon: HelpIcon },
] as const

export function NavigationFooter({ onLinkClick }: NavigationFooterProps) {
  const t = useTranslations('common')

  return (
    <div className='bg-gray-50 px-3 py-6'>
      <ul className='flex flex-col gap-3'>
        {footerLinks.map((link) => {
          const IconComponent = link.icon
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onLinkClick}
                className='flex h-6 items-center lord-of-the-focus-ring text-base text-gray-700'
              >
                <IconComponent
                  className='size-6 text-gray-700'
                  aria-hidden='true'
                />
                <span className='ml-3'>{t(link.translationKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
