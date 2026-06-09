import { initRouteContext } from '@/lib/request-context/route-context'
import { DataSourceSelector } from '@demo/data-source-selector'
import { StandardContainer } from '@/components/ui/standard-container'

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string; locale: string }>
}) {
  const { variant, locale } = await params
  initRouteContext({ variant, locale })
  return (
    <StandardContainer className='py-8'>
      <DataSourceSelector />
    </StandardContainer>
  )
}
