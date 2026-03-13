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
      'Free returns\nLargest selection\nSecure payment\nHuge size selection\nDirect from manufacturer',
  },
  'de-DE': {
    topBarMessages:
      'Kostenlose Retoure\nGrößtes Sortiment\nSichere Zahlung\nRiesige Größenauswahl\nDirekt vom Hersteller',
  },
}

// ——— Migration ———

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  await ensureNoEntryOfType(client, 'topBar', 'Top bar entry already exists')
  await createEntryWithLocales(client, 'topBar', TOP_BAR_ENTRY)
}

export = run
