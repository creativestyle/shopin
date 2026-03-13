/**
 * Get the CSS class names for selector container layout
 * @param layout - 'grid' for 2-column grid, 'inline' for horizontal flex
 * @param wrap - Whether to wrap in inline mode (default: true)
 */
export function getSelectorLayoutClass(
  layout: 'inline' | 'grid' = 'inline',
  wrap = true
): string {
  if (layout === 'grid') {
    return 'grid grid-cols-2 gap-2'
  }

  if (wrap) {
    return 'flex flex-wrap gap-2'
  }

  return 'flex gap-2'
}
