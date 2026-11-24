/**
 * @jest-environment node
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { APP_ROUTE_SEGMENTS } from '../app-route-segments'

const LOCALE_DIR = join(__dirname, '../../app/[variant]/[locale]')
// Routes that do have a CMS draft representation (or are the draft subtree itself)
const PREVIEWABLE = new Set(['p', 'c', 'preview'])

function routeFolders(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      // Route groups add no URL segment; look inside them
      if (/^\(.+\)$/.test(entry.name)) {
        return routeFolders(join(dir, entry.name))
      }
      return [entry.name]
    })
    .filter((name) => !name.startsWith('[') && !PREVIEWABLE.has(name))
}

describe('APP_ROUTE_SEGMENTS', () => {
  it('matches the app route folders under [variant]/[locale]', () => {
    expect([...APP_ROUTE_SEGMENTS].sort()).toEqual(
      routeFolders(LOCALE_DIR).sort()
    )
  })
})
