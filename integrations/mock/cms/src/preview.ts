/**
 * The CMS's preview request (the storefront's `PreviewRequest` slot): its preview URL is
 * `/api/draft?secret=<NEXT_DRAFT_MODE_SECRET>&slug=<entry slug>&locale=<locale>`. This only reads the parameters
 * (`null` for a missing one); SHOPin compares the secret and refuses the request when it does not match.
 */
export function previewRequest(query: URLSearchParams): {
  secret: string | null
  slug: string | null
  locale: string | null
} {
  return {
    secret: query.get('secret'),
    slug: query.get('slug'),
    locale: query.get('locale'),
  }
}
