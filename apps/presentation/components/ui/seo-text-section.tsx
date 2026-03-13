import React from 'react'
import { cn } from '@/lib/utils'
import { StandardContainer } from './standard-container'

export interface SEOTextSectionProps {
  title?: string
  content: string
  className?: string
}

export const SEOTextSection: React.FC<SEOTextSectionProps> = ({
  title,
  content,
  className,
}) => {
  const header = title ?? null
  return (
    <section className={cn('w-full border-t border-gray-100 py-14', className)}>
      <StandardContainer className='w-full'>
        <div className='flex flex-col gap-2'>
          {header && (
            <h2 className='text-sm/[1.1] font-bold text-gray-950'>{header}</h2>
          )}
          <p className='text-xs leading-relaxed text-gray-500'>{content}</p>
        </div>
      </StandardContainer>
    </section>
  )
}
