import { StandardContainer } from '../ui/standard-container'
import { TopBarFrame } from './top-bar-frame'
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
    <TopBarFrame
      ariaLabel={t('ariaLabel')}
      className={className}
    >
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
    </TopBarFrame>
  )
}
