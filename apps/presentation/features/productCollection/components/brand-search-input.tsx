'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import CloseIcon from '@/public/icons/close.svg'
import SearchIcon from '@/public/icons/search.svg'

interface BrandSearchInputProps {
  value: string
  onChange: (value: string) => void
}

export function BrandSearchInput({ value, onChange }: BrandSearchInputProps) {
  const t = useTranslations('productCollection')

  return (
    <div className='relative mb-4'>
      <SearchIcon className='absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-gray-400' />
      <input
        type='text'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=' '
        className='peer w-full rounded-md border border-gray-300 py-2 pt-5 pr-10 pb-1 pl-10 text-sm placeholder-transparent focus:border-gray-500 focus:outline-none'
      />
      <label
        className={cn(
          'pointer-events-none absolute left-10 text-gray-400 transition-all',
          'top-1/2 -translate-y-1/2 text-sm',
          'peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-xs',
          'peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs'
        )}
      >
        {t('filters.searchByName' as Parameters<typeof t>[0])}
      </label>
      {value && (
        <button
          type='button'
          onClick={() => onChange('')}
          className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600'
        >
          <CloseIcon className='h-4 w-4' />
        </button>
      )}
    </div>
  )
}
