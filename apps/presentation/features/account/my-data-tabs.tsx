'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { FC, PropsWithChildren } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import { useSelectedLayoutSegment } from 'next/navigation'

const TABS = [
  {
    value: 'personal-data',
    labelKey: 'personalDataLabel',
    segmentKey: null,
  },
  {
    value: 'addresses',
    labelKey: 'addressesLabel',
    segmentKey: 'addresses',
  },
  {
    value: 'change-password',
    labelKey: 'changePasswordLabel',
    segmentKey: 'change-password',
  },
] as const

export const MyDataTabs: FC<PropsWithChildren> = ({ children }) => {
  const segment = useSelectedLayoutSegment()
  const t = useTranslations('account.myAccount')

  return (
    <Tabs defaultValue={segment || 'personal-data'}>
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            asChild
          >
            <Link
              href={`/account/my-data${tab.segmentKey ? `/${tab.segmentKey}` : ''}`}
            >
              {t(tab.labelKey)}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent
        value={segment || 'personal-data'}
        className='pt-8'
      >
        {children}
      </TabsContent>
    </Tabs>
  )
}
