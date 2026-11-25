/**
 * Footer: Footer Section and Footer content types (with all fields).
 * Fails if content types already exist. Run after 01-01-02-link and 01-03-01-top-bar.
 */
import {
  getLayoutContentTypeDefinition,
  getFooterContentTypeDefinition,
} from './definitions'
import type Migration from 'contentful-migration'
import { applyContentTypeFromDefinition } from '../lib/content-type'

async function run(migration: Migration) {
  applyContentTypeFromDefinition(
    migration,
    getLayoutContentTypeDefinition('footerSection')
  )
  applyContentTypeFromDefinition(migration, getFooterContentTypeDefinition())
}

export = run
