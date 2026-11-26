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
      'DEMO ONLY: SHOPin Accelerator presentation. All products are fictional — no real orders, payments, or shipping.',
  },
  'de-DE': {
    topBarMessages:
      'NUR DEMO: SHOPin Accelerator Präsentation. Alle Produkte sind fiktiv – keine echten Bestellungen, Zahlungen oder Lieferungen.',
  },
}

// ——— Migration ———

async function run(migration: unknown) {
  const client = getManagementClient(migration)
  await ensureNoEntryOfType(client, 'topBar', 'Top bar entry already exists')
  await createEntryWithLocales(client, 'topBar', TOP_BAR_ENTRY)
}

export = run
