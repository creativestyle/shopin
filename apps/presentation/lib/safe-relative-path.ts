// One leading slash, then printable ASCII only; no backslash anywhere
const SAFE_RELATIVE_PATH = /^\/(?![/\\])[!-[\]-~]*$/

/** True when a browser resolves the path against the current host. */
export function isSafeRelativePath(value: string): boolean {
  return SAFE_RELATIVE_PATH.test(value)
}
