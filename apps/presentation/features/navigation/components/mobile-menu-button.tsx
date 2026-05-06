'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import HamburgerMenuIcon from '@/public/icons/hamburgermenu.svg'
import { MobileNavigation } from './mobile-navigation/mobile-navigation'
import { Button } from '@/components/ui/button'

interface MobileMenuButtonProps {
  navigationItems: MainNavigationResponse | null
}

export function MobileMenuButton({ navigationItems }: MobileMenuButtonProps) {
  const t = useTranslations('common')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <Button
        size='icon-sm'
        variant='tertiary'
        scheme='black'
        className='inline-flex items-center justify-center lord-of-the-focus-ring rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-primary disabled:pointer-events-none disabled:opacity-50'
        onClick={() => setIsMobileMenuOpen(true)}
        aria-expanded={isMobileMenuOpen}
        aria-label={t('toggleMobileMenu')}
        aria-haspopup='menu'
      >
        <HamburgerMenuIcon className='size-5' />
      </Button>

      <MobileNavigation
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        navigation={navigationItems}
      />
    </>
  )
}
