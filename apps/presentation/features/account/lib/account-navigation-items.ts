import AppIcon from '@/public/icons/app.svg'
import CartIcon from '@/public/icons/cart.svg'
import UserIdIcon from '@/public/icons/userid.svg'
import { ComponentType, SVGProps } from 'react'

type TranslationKey = 'overviewLabel' | 'ordersLabel' | 'myDataLabel'
type DescriptionTranslationKey = 'ordersDescription' | 'myDataDescription'

export type AccountPageKey = 'overview' | 'orders' | 'my-data'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface AccountNavigationItem {
  href: string
  translationKeys: {
    label: TranslationKey
    description?: DescriptionTranslationKey
  }
  icon: IconComponent
}

export const ACCOUNT_NAVIGATION_ITEMS: Record<
  AccountPageKey,
  AccountNavigationItem
> = {
  'overview': {
    href: '/account',
    translationKeys: {
      label: 'overviewLabel',
    },
    icon: AppIcon,
  },
  'orders': {
    href: '/account/orders',
    translationKeys: {
      label: 'ordersLabel',
      description: 'ordersDescription',
    },
    icon: CartIcon,
  },
  'my-data': {
    href: '/account/my-data',
    translationKeys: {
      label: 'myDataLabel',
      description: 'myDataDescription',
    },
    icon: UserIdIcon,
  },
} as const
