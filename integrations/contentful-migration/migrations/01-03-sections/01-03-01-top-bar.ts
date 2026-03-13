/**
 * Top Bar content type (singleton).
 * Fails if content type already exists.
 */
import { getLayoutContentTypeDefinition } from './definitions'
import type Migration from 'contentful-migration'
import { applyContentTypeFromDefinition } from '../lib/content-type'

async function run(migration: Migration) {
  applyContentTypeFromDefinition(
    migration,
    getLayoutContentTypeDefinition('topBar')
  )
}

export = run
