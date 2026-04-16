import { cn } from '../../lib/utils'
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

  const content = (
    <StandardContainer className='flex items-center justify-center'>
      <ul className='flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-xs font-normal text-white'>
        {messages.map((msg, i) => (
          <li
            key={i}
            className='leading-[1.6]'
          >
            {msg}
          </li>
        ))}
      </ul>
    </StandardContainer>
  )

  return (
    <>
      <aside
        aria-label={t('ariaLabel')}
        tabIndex={0}
        className={cn(
          'container-type-inline-size fixed top-0 z-50 w-full bg-gray-950 py-1.5',
          'outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset',
          className
        )}
      >
        {content}
      </aside>
      {/* Invisible spacer — mirrors the bar's content so layout height matches
          even when messages wrap to multiple lines */}
      <div
        aria-hidden
        className='container-type-inline-size invisible w-full bg-transparent py-1.5 text-xs text-white'
      >
        {content}
      </div>
    </>
  )
}
