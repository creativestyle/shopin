import { cn } from '../../lib/utils'
import { StandardContainer } from '../ui/standard-container'
import { getTranslations } from 'next-intl/server'

interface TopBarProps {
  className?: string
  messages: string[]
}

function MessageList({ children }: { children: React.ReactNode }) {
  return (
    <StandardContainer className='flex items-center justify-center will-change-transform'>
      <ul className='flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center text-xs font-normal text-white'>
        {children}
      </ul>
    </StandardContainer>
  )
}

export async function TopBar({ className, messages }: TopBarProps) {
  if (messages.length === 0) {
    return null
  }

  const t = await getTranslations('topBar')

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
        <MessageList>
          {messages.map((msg, i) => (
            <li
              key={i}
              className='leading-[1.6]'
            >
              {msg}
            </li>
          ))}
        </MessageList>
      </aside>
      {/* Invisible spacer — mirrors the bar's height so layout below clears
          the fixed bar. CSS ::before pseudo-elements (not DOM text nodes) are
          used so Playwright's getByText cannot match the spacer text. */}
      <div
        aria-hidden
        className='container-type-inline-size invisible w-full bg-transparent py-1.5 text-xs text-white'
      >
        <MessageList>
          {messages.map((msg, i) => (
            <li
              key={i}
              data-msg={msg}
              className='leading-[1.6] before:block before:content-[attr(data-msg)]'
            />
          ))}
        </MessageList>
      </div>
    </>
  )
}
