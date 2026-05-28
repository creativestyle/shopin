'use client'

import { Card } from '@/components/ui/card'

const SkeletonBar = ({ w, h }: { w: string; h: string }) => (
  <div className={`${h} ${w} animate-pulse rounded bg-gray-200`} />
)

export const CustomerAddressesSkeleton = () => (
  <div className='grid min-h-72 grid-cols-1 gap-4 xl:grid-cols-2'>
    {Array.from({ length: 2 }, (_, i) => (
      <Card
        key={i}
        scheme='white'
        className='flex flex-col justify-between border border-gray-200'
      >
        <div className='mb-4 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:justify-between sm:gap-2'>
          <div className='space-y-2'>
            <SkeletonBar
              h='h-5'
              w='w-40'
            />
            <SkeletonBar
              h='h-4'
              w='w-32'
            />
            <SkeletonBar
              h='h-4'
              w='w-24'
            />
          </div>
          <div className='flex flex-col gap-y-2 sm:items-end'>
            <SkeletonBar
              h='h-8'
              w='w-24'
            />
            <SkeletonBar
              h='h-8'
              w='w-24'
            />
          </div>
        </div>
        <div className='flex gap-4 border-t border-gray-200 pt-4'>
          <SkeletonBar
            h='h-6'
            w='w-28'
          />
          <SkeletonBar
            h='h-6'
            w='w-28'
          />
        </div>
      </Card>
    ))}
  </div>
)
