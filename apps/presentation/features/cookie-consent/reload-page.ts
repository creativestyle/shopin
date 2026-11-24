/** Full page reload; its own module so tests can mock it (jsdom's location.reload can't be). */
export function reloadPage(): void {
  window.location.reload()
}
