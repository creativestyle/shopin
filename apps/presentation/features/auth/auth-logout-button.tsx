'use client'

import { useLogout } from './hooks/use-logout'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import LogoutIcon from '@/public/icons/logout.svg'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  className?: string
  /** Called after successful logout. Page is responsible for redirect/navigation. */
  onAfterLogout?: () => void
}

export const LogoutButton: FC<LogoutButtonProps> = ({
  className,
  onAfterLogout,
}) => {
  const t = useTranslations('account.myAccount')
  const { handleLogout, isLoggingOut } = useLogout({ onSuccess: onAfterLogout })

  return (
    <button
      type='button'
      onClick={async () => {
        await handleLogout()
      }}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      className={cn(
        'flex cursor-pointer gap-3 disabled:cursor-not-allowed',
        className
      )}
    >
      <LogoutIcon
        className='size-6'
        aria-hidden='true'
      />
      <span>{t('logout')}</span>
    </button>
  )
}
