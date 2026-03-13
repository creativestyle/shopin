/**
 * Content type definition and application (contentful-migration createContentType/createField).
 */
import type Migration from 'contentful-migration'
import type { IFieldOptions } from 'contentful-migration'

export type FieldSpec = Required<Pick<IFieldOptions, 'name' | 'type'>> &
  Pick<
    IFieldOptions,
    'required' | 'linkType' | 'items' | 'validations' | 'localized'
  >

export interface ContentTypeDefinition {
  id: string
  name: string
  description?: string
  displayField: string
  fields: { id: string; spec: FieldSpec }[]
}

export type MigrationFunctionWithDefinition = (
  migration: Migration
) => Promise<void>

/** Applies a content type definition using only contentful-migration createContentType/createField API. */
export function applyContentTypeFromDefinition(
  migration: Migration,
  def: ContentTypeDefinition
): void {
  const ct = migration
    .createContentType(def.id)
    .name(def.name)
    .description(def.description ?? '')
    .displayField(def.displayField)
  for (const { id: fieldId, spec } of def.fields) {
    const f = ct
      .createField(fieldId)
      .name(spec.name)
      .type(spec.type)
      .required(!!spec.required)
    if (spec.localized !== undefined) {
      f.localized(!!spec.localized)
    } else {
      // Default: do not localize. Set localized: true only on fields that need translation (e.g. labels, headlines, body).
      f.localized(false)
    }
    if (spec.linkType != null && f.linkType) {
      f.linkType(spec.linkType)
    }
    if (spec.items != null && f.items) {
      f.items(spec.items)
    }
    if (spec.validations?.length && f.validations) {
      f.validations(spec.validations)
    }
  }
}
