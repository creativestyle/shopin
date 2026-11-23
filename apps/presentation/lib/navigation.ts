import { createNavigation } from 'next-intl/navigation'
import { routing } from '@/i18n/routing'

const navigation = createNavigation(routing)

export const { Link, usePathname, useRouter } = navigation

// TS narrows on never-returning calls only when the callee is annotated, not destructured.
export const redirect: (
  ...args: Parameters<typeof navigation.redirect>
) => never = navigation.redirect
