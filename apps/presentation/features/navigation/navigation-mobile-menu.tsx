import { getMainNavigation } from './lib/get-main-navigation'
import { MobileMenuButton } from './components/mobile-menu-button'

/**
 * Server component: fetches navigation data and renders the mobile menu button + sheet.
 * Entry point – use this from layout/header; do not import from components/lib/hooks outside the feature.
 */
export async function NavigationMobileMenu() {
  const navigationItems = await getMainNavigation()
  return <MobileMenuButton navigationItems={navigationItems} />
}
