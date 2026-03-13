import { FC } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LineItemImagesProps {
  images: { url: string; alt?: string }[]
  maxVisible?: number
  size?: 'sm' | 'md'
}

const SIZE_CLASSES = {
  sm: 'h-12 w-12',
  md: 'h-14 w-14',
} as const

const IMAGE_SIZES = {
  sm: '48px',
  md: '56px',
} as const

export const LineItemImages: FC<LineItemImagesProps> = ({
  images,
  maxVisible = 2,
  size = 'md',
}) => {
  const visible = images.slice(0, maxVisible)
  const extraCount = images.length - maxVisible

  return (
    <div className='flex items-center gap-2'>
      {visible.length > 0 ? (
        visible.map((img, i) => (
          <div
            key={i}
            className={cn(
              'relative shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50',
              SIZE_CLASSES[size]
            )}
          >
            <Image
              src={img.url}
              alt={img.alt || ''}
              fill
              className='object-cover'
              sizes={IMAGE_SIZES[size]}
            />
          </div>
        ))
      ) : (
        <div
          className={cn(
            'shrink-0 rounded border border-gray-200 bg-gray-100',
            SIZE_CLASSES[size]
          )}
        />
      )}
      {extraCount > 0 && (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 text-sm font-medium text-gray-500',
            SIZE_CLASSES[size]
          )}
        >
          +{extraCount}
        </div>
      )}
    </div>
  )
}
