import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import { rfcToUrlPrefix } from '@config/constants'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  const locale = await getLocale()
  const homeUrl = `/${rfcToUrlPrefix(locale)}`

  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-6 px-4 text-center'>
      <p className='text-8xl font-bold text-gray-200'>404</p>
      <h1 className='text-2xl font-bold text-gray-900'>{t('title')}</h1>
      <p className='max-w-md text-gray-500'>{t('description')}</p>
      <Link
        href={homeUrl}
        className='rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-700'
      >
        {t('backHome')}
      </Link>
    </div>
  )
}
