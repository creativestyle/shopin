/**
 * Mocked Google Fonts responses for e2e builds.
 *
 * Wired via NEXT_FONT_GOOGLE_MOCKED_RESPONSES (playwright.config.ts) so that
 * `next build` never hits fonts.googleapis.com — e2e builds are hermetic and
 * work offline / in sandboxed environments.
 *
 * Keys must exactly match the css2 URL next/font requests (derived from the
 * DM_Sans options in app/[variant]/[locale]/layout.tsx).
 *
 * The @font-face uses only local() sources — no url() — because Turbopack's
 * mock mode mocks the CSS response but still fetches any url() font files over
 * the network. With local() sources there is nothing to download; pages fall
 * back to system fonts, which is irrelevant for e2e assertions.
 */
const dmSansCss = `
/* latin */
@font-face {
  font-family: 'DM Sans';
  font-style: normal;
  font-weight: 100 1000;
  font-display: swap;
  src: local('Helvetica Neue'), local('Arial');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
`

module.exports = {
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@100..1000&display=swap':
    dmSansCss,
}
