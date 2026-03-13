import { getMainNavigation } from './lib/get-main-navigation'
import { MainNavigation } from './components/main-navigation'

/**
 * Server component: fetches navigation data and renders the desktop main nav.
 * Entry point – use this from layout/header; do not import from components/lib/hooks outside the feature.
 */
export async function NavigationDesktop() {
  const navigation = await getMainNavigation()
  return <MainNavigation items={navigation?.items ?? []} />
}
