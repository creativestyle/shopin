/**
 * Absolute path to the hero gradient PNG in @integrations/contentful-api (source of truth).
 * Resolved from compiled output under dist/migrations/lib/.
 */
import { join } from 'node:path'

export const HERO_GRADIENT_PNG_PATH = join(
  __dirname,
  '../../../../../integrations/contentful-api/src/assets/gradient.png'
)
