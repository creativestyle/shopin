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
    <div className='absolute right-0 bottom-0 left-0 flex h-18 items-center justify-between border-t border-gray-200 bg-white px-3'>
      <button
        type='button'
        onClick={onResetAll}
        className='flex cursor-pointer items-center gap-2 text-sm underline'
      >
        <ReloadIcon
          className='h-4 w-4'
          aria-hidden='true'
        />
        {t('filters.resetAll' as Parameters<typeof t>[0])}
      </button>

      <Button onClick={onApplyFilters}>
        {t('filters.applyFilters' as Parameters<typeof t>[0])}
      </Button>
    </div>
  )
}
