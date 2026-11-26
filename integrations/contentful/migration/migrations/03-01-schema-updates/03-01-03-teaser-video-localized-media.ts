/**
 * Teaser Video: per-locale video and thumbnail, plus a per-locale WebVTT captions asset.
 * Existing values are copied to every locale so nothing goes blank after localizing.
 */
import type Migration from 'contentful-migration'
import { DEFAULT_LOCALE } from '../lib/constants'

const LOCALIZED_MEDIA_FIELDS = ['video', 'thumbnail'] as const

async function run(migration: Migration) {
  const teaserVideo = migration.editContentType('teaserVideo')

  teaserVideo.editField('video').localized(true)
  teaserVideo.editField('thumbnail').localized(true)

  teaserVideo
    .createField('captions')
    .name('Captions (WebVTT)')
    .type('Link')
    .linkType('Asset')
    .localized(true)
  teaserVideo.moveField('captions').afterField('thumbnail')

  teaserVideo.changeFieldControl('thumbnail', 'builtin', 'assetLinkEditor', {
    helpText: 'Poster image shown before playback.',
  })
  teaserVideo.changeFieldControl('captions', 'builtin', 'assetLinkEditor', {
    helpText:
      'Required when the video has audio: upload a .vtt captions file for this locale.',
  })

  migration.transformEntries({
    contentType: 'teaserVideo',
    from: [...LOCALIZED_MEDIA_FIELDS],
    to: [...LOCALIZED_MEDIA_FIELDS],
    shouldPublish: 'preserve',
    transformEntryForLocale: (fields, locale) => {
      if (locale === DEFAULT_LOCALE) {
        return undefined
      }
      const copied: Record<string, unknown> = {}
      for (const field of LOCALIZED_MEDIA_FIELDS) {
        const value = fields[field]?.[locale] ?? fields[field]?.[DEFAULT_LOCALE]
        if (value) {
          copied[field] = value
        }
      }
      return Object.keys(copied).length > 0 ? copied : undefined
    },
  })
}

export = run
