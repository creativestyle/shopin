/** A string literal for a commercetools query predicate: backslashes and quotes escaped, then quoted. */
export const quoted = (v: string) =>
  `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
