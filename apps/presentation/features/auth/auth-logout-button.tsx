'use client'

import { useLogout } from './hooks/use-logout'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import LogoutIcon from '@/public/icons/logout.svg'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
    <Button
      type='button'
      variant='tertiary'
      scheme='black'
      size='none'
      onClick={async () => {
        await handleLogout()
      }}
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      className={cn(
        'flex justify-start gap-3 disabled:cursor-not-allowed',
        className
      )}
    >
      <LogoutIcon
        className='size-6'
        aria-hidden='true'
      />
      <span>{t('logout')}</span>
    </Button>
  )
}
