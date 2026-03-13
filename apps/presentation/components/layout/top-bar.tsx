import * as React from 'react'
import { cn } from '../../lib/utils'
import { DataSourceIndicator } from '@demo/data-source-selector'
import { StandardContainer } from '../ui/standard-container'

interface TopBarProps {
  className?: string
  messages: string[]
}

export const TopBar: React.FC<TopBarProps> = ({ className, messages }) => {
  return (
    <div
      className={cn(
        'relative h-6 w-full overflow-hidden bg-gray-950 md:h-7',
        className
      )}
    >
      <DataSourceIndicator />
      <StandardContainer className='flex h-full items-center justify-center'>
        {messages.length > 0 && (
          <>
            <div className='hidden h-full flex-row items-center justify-center text-center text-xs font-normal text-white md:flex'>
              <div className='flex items-center gap-6'>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className='relative shrink-0'
                  >
                    <span className='block leading-[1.6]'>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className='flex h-full flex-row items-center justify-center text-center text-xs font-normal text-white md:hidden'>
              <span className='block leading-[1.6]'>{messages[0]}</span>
            </div>
          </>
        )}
      </StandardContainer>
    </div>
  )
}
