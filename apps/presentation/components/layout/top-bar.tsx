import { cn } from '../../lib/utils'
import { DataSourceIndicator } from '@demo/data-source-selector'
import { StandardContainer } from '../ui/standard-container'
import { getTranslations } from 'next-intl/server'

interface TopBarProps {
  className?: string
  messages: string[]
}

export async function TopBar({ className, messages }: TopBarProps) {
  if (messages.length === 0) {
    return null
  }

  const t = await getTranslations('topBar')

  return (
    <aside
      aria-label={t('ariaLabel')}
      className={cn('sticky top-0 z-50 w-full bg-gray-950 py-1.5', className)}
    >
      <DataSourceIndicator />
      <StandardContainer className='flex items-center justify-center'>
        <div className='flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-xs font-normal text-white'>
          {messages.map((msg, i) => (
            <span
              key={i}
              className='leading-[1.6]'
            >
              {msg}
            </span>
          ))}
        </div>
      </StandardContainer>
    </aside>
  )
}
