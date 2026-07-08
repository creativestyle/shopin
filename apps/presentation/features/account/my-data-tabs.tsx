'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Link } from '@/lib/navigation'
import { FC, PropsWithChildren, useState } from 'react'
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
  const [activeTab, setActiveTab] = useState(segment || 'personal-data')
  const [prevSegment, setPrevSegment] = useState(segment)

  if (prevSegment !== segment) {
    setPrevSegment(segment)
    setActiveTab(segment || 'personal-data')
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
    >
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
        value={activeTab}
        className='min-h-72 pt-8'
      >
        {children}
      </TabsContent>
    </Tabs>
  )
}
