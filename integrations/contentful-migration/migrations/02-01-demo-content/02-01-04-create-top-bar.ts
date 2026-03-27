/**
 * Creates the Top Bar entry (singleton). Fails if it already exists.
 * Run after page content (02-01-01 … 02-01-03) so layout follows content.
 */
import { getManagementClient } from '../lib/client'
import { createEntryWithLocales } from '../lib/entries'
import { ensureNoEntryOfType } from '../lib/page-teasers'

// ——— Migrated content ———

const TOP_BAR_ENTRY = {
  'en-US': {
    topBarMessages:
      'This demo store showcases the SHOPin storefront accelerator. No real orders can be placed.',
  },
  'de-DE': {
    topBarMessages:
      'Dieser Demo-Shop zeigt den SHOPin Storefront Accelerator. Echte Bestellungen sind nicht moeglich.',
  },
}

// ——— Migration ———

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  await ensureNoEntryOfType(client, 'topBar', 'Top bar entry already exists')
  await createEntryWithLocales(client, 'topBar', TOP_BAR_ENTRY)
}

export = run
