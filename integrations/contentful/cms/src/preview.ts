/**
 * The CMS's preview request (the storefront's `PreviewRequest` slot): its preview URL is
 * `/api/draft?secret=<NEXT_DRAFT_MODE_SECRET>&slug=<entry slug>&locale=<locale>`. The secret is compared by SHOPin.
 */
export function previewRequest(
  query: URLSearchParams,
  secretMatches: (value: string | null) => boolean
): { slug: string | null; locale: string | null } | undefined {
  return secretMatches(query.get('secret'))
    ? { slug: query.get('slug'), locale: query.get('locale') }
    : undefined
}
