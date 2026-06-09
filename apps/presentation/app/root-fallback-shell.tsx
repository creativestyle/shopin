import type { ReactNode } from 'react'

/**
 * Minimal HTML shell used by root-level error boundaries (global-error.tsx,
 * not-found.tsx) that must render their own <html>/<body> because the root
 * layout.tsx is intentionally a bare fragment (<>{children}</>).
 *
 * Embeds DM Sans and brand styles directly — globals.css is not guaranteed to
 * be loaded when global-error.tsx replaces the entire layout tree.
 *
 * Accepts an optional `lang` prop (defaults to 'en') for callers that have
 * locale context available.
 */
export function RootFallbackShell({
  children,
  lang = 'en',
}: {
  children: ReactNode
  lang?: string
}) {
  return (
    <html lang={lang}>
      <head>
        <meta charSet='utf-8' />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1'
        />
        <link
          rel='preconnect'
          href='https://fonts.googleapis.com'
        />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href='https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap'
          rel='stylesheet'
        />
        <style>{FALLBACK_STYLES}</style>
      </head>
      <body>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/logo.svg'
          alt='SHOPin'
          width={120}
          height={38}
          className='fallback-logo'
        />
        <div className='fallback-content'>{children}</div>
      </body>
    </html>
  )
}

const FALLBACK_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { line-height: 1.5; }
  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #ffffff;
    color: #030712;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2.5rem;
    padding: 1.5rem;
  }
  .fallback-logo { width: 120px; height: auto; }
  .fallback-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    text-align: center;
    max-width: 400px;
  }
  .fallback-content h1 {
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: #030712;
  }
  .fallback-content a,
  .fallback-content button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.5rem;
    background: #b7183e;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-family: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background 150ms ease;
  }
  .fallback-content a:hover,
  .fallback-content button:hover { background: #d82b55; }
`
