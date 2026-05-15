import { DataSourceSelector } from '@demo/data-source-selector'
import { StandardContainer } from '@/components/ui/standard-container'

export default function SetupPage() {
  return (
    <StandardContainer className='py-8'>
      <DataSourceSelector />
    </StandardContainer>
  )
}
