import { getTranslations } from 'next-intl/server'
import { ALLOWED_DATA_SOURCES } from '@config/constants'
import type { DataSource } from '@config/constants'
import { initRouteContext } from '@/lib/request-context/route-context'
import { decodeVariant } from '@/lib/variant/variant-key'
import { DataSourceSelector } from '@demo/data-source-selector'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })
  const t = await getTranslations('dataSourceSelector')

  const options = ALLOWED_DATA_SOURCES.map((value) => ({
    value,
    name: t(`sources.${value}.name`),
    description: t(`sources.${value}.description`),
  }))

  return (
    <StandardContainer className='py-8'>
      <DataSourceSelector
        initialDataSource={decodeVariant(variant).dataSource as DataSource}
        labels={{
          title: t('title'),
          intro: t('intro'),
          select: t('select'),
          selected: t('selected'),
          currentSelection: t('currentSelection'),
        }}
        options={options}
      />
    </StandardContainer>
  )
}
