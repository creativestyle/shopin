/**
 * Variant fixtures derived from the build-time data (SHOPIN_STOREFRONT, set by jest.config.ts from the
 * fixture config in ./storefront.ts), so the tests name no provider and keep working when providers are
 * added, removed or reordered there.
 */
import { STOREFRONT } from '@/lib/storefront-config'
import { VARIANT_DIMENSIONS } from '../registry'

const SEP = '__'
export type Resolved = Record<string, string>

export const DIMS = VARIANT_DIMENSIONS

export const segmentOf = (r: Resolved) =>
  `~${DIMS.map((d) => r[d.name]).join(SEP)}`

/** What the config makes of a choice (same resolution as the BFF). */
export function normalised(r: Resolved): Resolved {
  const key = DIMS.map((d) => r[d.name] ?? d.defaultValue).join(SEP)
  const found = STOREFRONT.variants.combinations[key]
  const values = (found && 'to' in found ? found.to : key).split(SEP)
  return Object.fromEntries(DIMS.map((d, i) => [d.name, values[i]!]))
}

export const DEFAULT_RESOLVED: Resolved = Object.fromEntries(
  DIMS.map((d) => [d.name, d.defaultValue])
)
export const DEFAULT = segmentOf(DEFAULT_RESOLVED)

/** One cookie set to the first dimension's first non-default provider, and the variant it gives. */
const altDim = DIMS[0]!
export const ALT_COOKIE = {
  name: altDim.cookie,
  value: altDim.allowed.find((v) => v !== altDim.defaultValue)!,
}
export const ALT_RESOLVED = normalised({
  ...DEFAULT_RESOLVED,
  [altDim.name]: ALT_COOKIE.value,
})
export const ALT = segmentOf(ALT_RESOLVED)

/** A combination of known providers the config rules out (a requirement is not met), if any. */
export const RULED_OUT: { raw: Resolved; resolved: Resolved } | undefined =
  DIMS.flatMap((d) =>
    d.allowed.map((v) => {
      const raw = { ...DEFAULT_RESOLVED, [d.name]: v }
      return { raw, resolved: normalised(raw) }
    })
  ).find(({ raw, resolved }) => segmentOf(raw) !== segmentOf(resolved))

export const HAS_REQUIREMENTS = Object.values(
  STOREFRONT.variants.combinations
).some((c) => 'to' in c || Object.keys(c.unavailable).length > 0)

/** Every allowed combination: the cartesian product of the dimensions, normalised and deduplicated. */
export function allVariants(): string[] {
  let combos: Resolved[] = [{}]
  for (const d of DIMS) {
    combos = combos.flatMap((c) =>
      d.allowed.map((v) => ({ ...c, [d.name]: v }))
    )
  }
  return [...new Set(combos.map((c) => segmentOf(normalised(c))))]
}
