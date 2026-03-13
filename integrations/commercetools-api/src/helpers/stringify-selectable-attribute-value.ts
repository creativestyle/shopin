import type { LocalizedString } from '@commercetools/platform-sdk'
import { getLocalizedString } from './get-localized-string'
import { isCssColor, stripColorSuffix } from './color-utils'

/**
 * Converts a raw attribute value of a "selectable" type into a displayable string.
 * This function is designed for attribute values that are used for variant selection.
 *
 * @param raw The raw attribute value from commercetools.
 * @param currentLanguage The current language/locale for localization (e.g., 'en', 'de-DE').
 * @returns A string representation of the attribute value, or an empty string if it cannot be processed.
 */
export function stringifySelectableAttributeValue(
  raw: unknown,
  currentLanguage: string
): string {
  const finalizeLabel = (value: string): string => {
    // Hide raw CSS color tokens; strip color suffixes from labels like "Black (#000000)"
    if (!value) {
      return ''
    }
    if (isCssColor(value)) {
      return ''
    }
    return stripColorSuffix(value)
  }

  // CT Attribute Types mapping (see docs: https://docs.commercetools.com/api/projects/products#attribute)
  // - text / number / boolean → handled as primitives
  // - ltext (LocalizedString) → handled via getLocalizedString
  // - enum (Plain Enum: { key: string; label: string }) → label branch
  // - lenum (Localized Enum: { key: string; label: LocalizedString }) → localized label branch
  // - Any other types (money/date/time/datetime/reference/set/object) are out of scope for "selectable" rendering here
  const computeRawLabel = (value: unknown, lang: string): string => {
    // Missing attribute value (any CT type) → empty label
    if (value === null || value === undefined) {
      return ''
    }
    // CT text | number | boolean attributes
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value)
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>
      // CT ltext (LocalizedString)
      const isLocalizedString = Object.keys(obj).every(
        (key) => typeof obj[key] === 'string'
      )
      if (isLocalizedString) {
        const localized = getLocalizedString(obj as LocalizedString, lang)
        if (localized) {
          return localized
        }
      }
      // CT enum (Plain Enum) → label is a string
      if (typeof obj.label === 'string') {
        return obj.label
      }
      // CT lenum (Localized Enum) → label is a LocalizedString
      if (typeof obj.label === 'object' && obj.label !== null) {
        const localizedLabel = getLocalizedString(
          obj.label as LocalizedString,
          lang
        )
        if (localizedLabel) {
          return localizedLabel
        }
      }
      // Fallback: some enum usage prefers key as display when label absent
      if (typeof obj.key === 'string') {
        return obj.key
      }
    }
    return ''
  }

  return finalizeLabel(computeRawLabel(raw, currentLanguage))
}
