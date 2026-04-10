import { NavigationMobileMenu } from '@/features/navigation/navigation-mobile-menu'
import { NavigationDesktop } from '@/features/navigation/navigation-desktop'
import { SearchBarWrapper } from './search-bar-wrapper'
import { UserMenuWrapper } from './user-menu-wrapper'
import { MobileAccountLink } from './mobile-account-link'
import { getTranslations } from 'next-intl/server'
import { Logo } from '../ui/logo'
import { HeaderSearchButton } from './header-search-button'
import { HeaderCartButton } from './header-cart-button'
import { StandardContainer } from '../ui/standard-container'

export async function Header() {
  const t = await getTranslations('userMenu')
  return (
    <header className='relative shadow-card'>
      {/* Mobile Header */}
      <div className='bg-background relative h-14 w-full overflow-hidden lg:hidden'>
        <StandardContainer className='h-full'>
          <div className='flex h-full items-center justify-between px-4 py-2'>
            {/* Left side: Menu + Account */}
            <div className='flex items-center gap-2'>
              <NavigationMobileMenu />
              <MobileAccountLink
                className='p-1 text-gray-900 hover:bg-gray-100 hover:text-primary'
                aria-label={t('account')}
              />
            </div>

            {/* Center: Logo */}
            <div className='relative flex h-10 w-32 items-center justify-center'>
              <Logo
                className='h-10 w-32 flex-shrink-0'
                src='/logo.svg'
                width={130}
                height={40}
              />
            </div>

            {/* Right side: Search + Cart */}
            <div className='flex items-center gap-2'>
              <HeaderSearchButton />
              <HeaderCartButton />
            </div>
          </div>
        </StandardContainer>
      </div>

      {/* Desktop Header */}
      <div className='bg-background relative hidden h-20 w-full lg:block'>
        <StandardContainer className='h-full'>
          {/* First Row: Logo, Search, User Menu */}
          <div className='flex h-full items-center gap-10 lg:gap-7'>
            {/* Logo */}
            <div className='relative flex h-12 w-40 flex-shrink-0 items-center'>
              <Logo
                className='h-12 w-40 flex-shrink-0'
                src='/logo.svg'
                width={156}
                height={48}
              />
            </div>

            {/* Navigation Menu */}
            <div className='flex h-full min-w-80 flex-1 items-center justify-start overflow-hidden'>
              <NavigationDesktop />
            </div>

            {/* Search Bar - Desktop */}
            <div className='mx-auto flex h-12 w-full max-w-150 min-w-64 flex-shrink flex-row items-center justify-start'>
              <SearchBarWrapper />
            </div>

            {/* User Menu - Desktop */}
            <div className='flex flex-shrink-0 items-center'>
              <UserMenuWrapper />
            </div>
          </div>
        </StandardContainer>
      </div>
    </header>
  )
}
