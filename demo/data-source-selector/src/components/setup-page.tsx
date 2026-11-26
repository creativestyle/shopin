import type { ShopPageProps } from '@core/integration-kit'
import type { ProviderView, Selection } from '@demo/provider-switch/view'
import { DataSourcePanel } from './data-source-panel'

/**
 * The /setup page (the storefront's `Pages` slot, key `setup`): the switch's view and this request's providers
 * from its BFF route (`GET /bff/switch`, `@demo/provider-switch/module`), and shopin's data-source selector over them
 * (the markup of the storefront's former /setup route).
 */
export async function SetupPage({ bff }: ShopPageProps) {
  const { providers, selected } = (await bff('switch')) as {
    providers: ProviderView
    selected: Selection
  }
  return (
    <div className='ui-container ui-max-width-container py-8'>
      <DataSourcePanel
        providers={providers}
        selected={selected}
      />
    </div>
  )
}
