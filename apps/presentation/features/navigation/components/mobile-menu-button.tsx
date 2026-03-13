'use client'

import { useState } from 'react'
import { MainNavigationResponse } from '@core/contracts/navigation/main-navigation'
import HamburgerMenuIcon from '@/public/icons/hamburgermenu.svg'
import { MobileNavigation } from './mobile-navigation/mobile-navigation'

interface MobileMenuButtonProps {
  navigationItems: MainNavigationResponse | null
}

export function MobileMenuButton({ navigationItems }: MobileMenuButtonProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <button
        type='button'
        className='inline-flex size-8 items-center justify-center lord-of-the-focus-ring rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-primary disabled:pointer-events-none disabled:opacity-50'
        onClick={() => setIsMobileMenuOpen(true)}
        aria-expanded={isMobileMenuOpen}
        aria-label='Toggle mobile menu'
      >
        <HamburgerMenuIcon className='size-5' />
      </button>

      <MobileNavigation
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
        navigation={navigationItems}
      />
    </>
  )
}
