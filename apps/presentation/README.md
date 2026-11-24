# @apps/presentation

Next.js (App Router) storefront UI for the SHOPin storefront accelerator. Renders product catalog, cart, checkout, auth, and CMS-driven pages; talks to the BFF for all e-commerce and content APIs.

## Environment Variables

The app reads env from the **repo root `.env`** (via `dotenv -e ../../.env` in scripts). Do not commit real values; use [root `.env.example`](../../.env.example) as the template.

Variables used by this app:

- **`NEXT_BFF_INTERNAL_URL`** — Server-side only. Base URL for the BFF including the `/bff` path (e.g. `http://localhost:4000/bff` or `http://bff:4000/bff` in Docker).
- **`NEXT_PUBLIC_BFF_EXTERNAL_URL`** — Client and SSR. Public BFF URL including `/bff` (e.g. `http://localhost:4000/bff`). Embedded at build time; set in CI/Docker when building.
- **`FRONTEND_URL`** — Used when building **canonical URLs and metadata** (e.g. `getSiteBaseUrl()` for hreflang and canonical links on pages). Required for that; the app throws if unset. Draft mode (`/api/draft`, `/api/draft/exit`) reads only its **protocol**: `https:` delivers the preview token via a `SameSite=None; Secure` cookie, anything else (or unset) via the `?__pt=` URL param. Draft redirects are path-only, so the editor stays on the host the CMS called; client-side BFF calls from a host other than `FRONTEND_URL` still need the BFF served same-origin (`/bff`), because BFF CORS allows only `FRONTEND_URL`.
- **`NEXT_DRAFT_MODE_SECRET`** — Used only when you use **draft/preview from a headless CMS** (e.g. Contentful). It secures the `/api/draft` route: the CMS preview URL must include `?secret=<NEXT_DRAFT_MODE_SECRET>`. The same secret is used to sign the draft cookie so the BFF can verify it. Omit or leave empty if you do not use draft/preview. See [Draft session behaviour](#draft-session-behaviour).

The `bffFetch` utility uses the internal URL on the server and the public URL in the browser, so the BFF base URL is never exposed to the client. For the full list of env variables (Contentful, logging, etc.), see the [root README – Installation](../../README.md#installation).

## Draft session behaviour

`/api/draft` starts a draft session that lasts up to an hour. While it is active:

- **Content, product and category URLs** render draft CMS content (product and category data stay published). The address bar keeps clean URLs; the proxy routes them into the internal `/preview` subtree.
- **App routes** (cart, checkout, account, search, sign-in and the other auth pages) render live data as usual.
- **The draft banner** shows on every storefront page. A non-HttpOnly `preview_active` cookie drives it; that cookie is only a UI hint, never a credential. Inside the CMS live-preview iframe the banner hides its exit link.
- **Editors leave** through the banner's "Exit preview" link (`/api/draft/exit`), which clears both cookies and returns to the published version of the current page.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to optimize and load [DM Sans](https://fonts.google.com/specimen/DM+Sans) from Google Fonts (see `app/layout.tsx`).

## Cookie consent

`features/cookie-consent` stores the visitor's choice per category (`analytics`, `marketing`) in the `cookie_consent` cookie. It ships with no trackers of its own. The demo store's mock tags come from `@demo/mock-tracking-tags`, which is removed together with the demo workspace.

To add a real tag (e.g. Google Tag Manager, Meta Pixel), render it from a client component in `app/[variant]/[locale]/layout.tsx` behind the category it belongs to:

```tsx
'use client'
import Script from 'next/script'
import { ConsentGate } from '@/features/cookie-consent/consent-gate'

export function AnalyticsTag() {
  return (
    <ConsentGate category='analytics'>
      <Script
        id='gtm'
        src='https://www.googletagmanager.com/gtm.js?id=GTM-XXXX'
      />
    </ConsentGate>
  )
}
```

- `useConsentGate(category)` returns the same flag when you need it outside JSX.
- When a visitor withdraws a category, the page reloads, so a tag that has already run stops tracking.
- List every cookie the tag sets in your cookie policy, and delete those cookies once the stored choice has been read (`isReady` from `useConsent()`) and the category isn't consented, like `@demo/mock-tracking-tags` does. Before `isReady` the choice is still unknown, so deleting then would wipe a consented visitor's cookie on every load.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Root README](../../README.md) for full monorepo setup

## License

OSL-3.0 — see [root LICENSE](../../LICENSE).
