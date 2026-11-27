/**
 * The commerce contract suite (`@core/integration-kit/testing`) run against a commercetools project, the same way when
 * recording (record-contract.mjs, against the real project) and when replaying (commerce-contract-recorded.test.mjs,
 * against the recording). Each case gets its own made-up names (`unique`), so a case's requests do not depend on
 * which cases ran before it.
 */
import testing from '@core/integration-kit/testing'
import descriptor from '../dist/shopin.js'
import storeChannels from '../dist/services/store-channels.service.js'

const { buildPort, commerceContract } = testing
const { commercetools } = descriptor

/** Where the recording lives. */
export const RECORDING = new URL(
  './recorded/commerce-contract.json',
  import.meta.url
)

/** The stores of the demo project, per locale of config/locales.json. */
export const STORE_KEYS = { 'en-US': 'us-store', 'de-DE': 'eu-store' }

/** What the recording shows instead of the project's own hosts and key (it is committed). */
export const RECORDED = {
  apiUrl: 'https://api.recorded.invalid',
  authUrl: 'https://auth.recorded.invalid',
  projectKey: 'recorded-project',
}

/**
 * The contract cases over a port built with `options` (the project's, or the recorded ones), with `data` (the
 * project's product, category and what the API client may do). `start(i)` is called before case `i` runs.
 */
export function contractCases(options, data) {
  let caseNo = 0
  let n = 0
  const cases = commerceContract(
    // as the BFF has the port after its start-up check: the stores' distribution channels read
    async (as) => {
      const port = await buildPort(
        commercetools({ storeKeys: STORE_KEYS }).ports.commerce(),
        {
          ...as,
          storefrontUrl: 'https://shop.test',
          options,
          locales: Object.keys(STORE_KEYS),
        }
      )
      await port[storeChannels.STORE_CHANNELS].load()
      return port
    },
    { ...data, unique: () => `rec${caseNo}x${++n}` }
  )
  return cases.map((c, i) => ({
    name: c.name,
    run: (...context) => {
      caseNo = i
      n = 0
      return c.run(...context)
    },
  }))
}
