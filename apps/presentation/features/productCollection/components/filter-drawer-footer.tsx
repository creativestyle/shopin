'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import ReloadIcon from '@/public/icons/reload.svg'

interface FilterDrawerFooterProps {
  onResetAll: () => void
  onApplyFilters: () => void
}

export function FilterDrawerFooter({
  onResetAll,
  onApplyFilters,
}: FilterDrawerFooterProps) {
  const t = useTranslations('productCollection')

  return (
    <div className='flex h-18 shrink-0 items-center justify-between border-t border-gray-200 bg-white px-3'>
      <Button
        type='button'
        variant='tertiary'
        scheme='black'
        size='auto'
        onClick={onResetAll}
        className='gap-2 font-normal underline'
      >
        <ReloadIcon
          className='h-4 w-4'
          aria-hidden='true'
        />
        {t('filters.resetAll' as Parameters<typeof t>[0])}
      </Button>

      <Button onClick={onApplyFilters}>
        {t('filters.applyFilters' as Parameters<typeof t>[0])}
      </Button>
    </div>
  )
}
