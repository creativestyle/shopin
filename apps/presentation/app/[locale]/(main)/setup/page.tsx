import { setRequestLocale } from 'next-intl/server'
import { DataSourceSelector } from '@demo/data-source-selector'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <StandardContainer className='py-8'>
      <DataSourceSelector />
    </StandardContainer>
  )
}
