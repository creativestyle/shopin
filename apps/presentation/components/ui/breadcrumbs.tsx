import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { CrumbResponse } from '@core/contracts/core/crumb'
import HomeIcon from '@/public/icons/home.svg'
import ChevronRightIcon from '@/public/icons/chevronright.svg'

async function Breadcrumbs({
  crumbs,
  className,
}: { crumbs: CrumbResponse[] } & { className?: string }) {
  const t = await getTranslations('common')
  const homeCrumb = {
    label: t('homepage'),
    path: '/',
  }
  const allCrumbs = [homeCrumb, ...crumbs]

  if (allCrumbs.length <= 1) {
    return null
  }

  return (
    <nav className={cn('relative overflow-x-clip', className)}>
      <ul className='-mx-4 no-scrollbar flex snap-x snap-proximity scroll-px-4 list-none items-center gap-1 overflow-x-auto overflow-y-hidden px-4 py-0 whitespace-nowrap'>
        {allCrumbs.map((crumb, index) => {
          const isLast = index === allCrumbs.length - 1

          const content =
            crumb.path === '/' ? (
              <>
                <HomeIcon
                  className='-mt-px size-4 shrink-0'
                  aria-hidden='true'
                />
                <span className='sr-only'>{crumb.label}</span>
              </>
            ) : (
              crumb.label
            )

          return (
            <li
              key={crumb.path}
              className='inline-flex items-center transition-colors'
            >
              {isLast ? (
                <span
                  className='text-xs font-bold text-gray-950'
                  aria-current='page'
                >
                  {content}
                </span>
              ) : (
                <Link
                  href={crumb.path}
                  className='text-xs text-gray-700 underline hover:text-gray-900 focus-visible:text-gray-900 focus-visible:outline-none'
                >
                  {content}
                </Link>
              )}
              {!isLast && (
                <ChevronRightIcon
                  className='ml-1 size-4 shrink-0 text-gray-700'
                  aria-hidden='true'
                />
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { Breadcrumbs }
