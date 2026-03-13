import { FC, PropsWithChildren } from 'react'
import { AccountNavigation } from './account-navigation'
import { AccountPageKey } from './lib/account-navigation-items'
import { cn } from '@/lib/utils'

interface AccountWrapperProps {
  activePage: AccountPageKey
  hideBackButton?: boolean
}

export const AccountWrapper: FC<PropsWithChildren<AccountWrapperProps>> = ({
  activePage,
  children,
  hideBackButton = false,
}) => {
  return (
    <div className='lg:grid lg:grid-cols-[20rem_1fr] lg:gap-8 lg:py-10'>
      <AccountNavigation
        activePage={activePage}
        hideBackButton={hideBackButton}
      />
      <div className={cn({ 'mt-8 lg:mt-0': !hideBackButton })}>{children}</div>
    </div>
  )
}
