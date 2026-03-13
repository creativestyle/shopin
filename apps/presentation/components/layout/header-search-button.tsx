'use client'

import { useTranslations } from 'next-intl'
import SearchIcon from '../../public/icons/search.svg'

export function HeaderSearchButton() {
  const t = useTranslations('userMenu')

  return (
    <button className='p-1 text-gray-900 hover:bg-gray-100 hover:text-primary'>
      <SearchIcon className='size-6' />
      <span className='sr-only'>{t('search')}</span>
    </button>
  )
}
