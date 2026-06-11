/**
 * @jest-environment node
 */

import { RuleTester } from 'eslint'

const rule = require('../require-init-route-context')

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

tester.run('require-init-route-context', rule, {
  valid: [
    // Standard call: variant destructured from route params
    {
      code: `
        async function Page({ params }) {
          const { variant, locale } = await params
          initRouteContext({ variant, locale })
        }
      `,
    },
    // variant destructured and locale comes separately — still valid
    {
      code: `
        async function Page({ params }) {
          const { variant } = await params
          const locale = 'en'
          initRouteContext({ variant, locale })
        }
      `,
    },
    // Client component: rule stays silent regardless of calls
    {
      code: `
        'use client'
        export default function ClientPage() {}
      `,
    },
    // Client component with a bad-looking call: still silent because 'use client'
    {
      code: `
        'use client'
        initRouteContext({ variant: 'x', locale: 'en' })
      `,
    },
    // Two valid calls in the same file (generateMetadata + default export)
    {
      code: `
        async function generateMetadata({ params }) {
          const { variant, locale } = await params
          initRouteContext({ variant, locale })
        }
        async function Page({ params }) {
          const { variant, locale } = await params
          initRouteContext({ variant, locale })
        }
      `,
    },
  ],

  invalid: [
    // No call at all
    {
      code: `
        async function Page({ params }) {
          const { variant, locale } = await params
        }
      `,
      errors: [{ messageId: 'missing' }],
    },
    // Inline string literal for variant
    {
      code: `
        async function Page({ params }) {
          const { locale } = await params
          initRouteContext({ variant: '~commercetools-set', locale })
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // variant missing from the object entirely
    {
      code: `
        async function Page({ params }) {
          const { locale } = await params
          initRouteContext({ locale })
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // Identifier argument instead of inline object literal
    {
      code: `
        async function Page({ params }) {
          const routeCtx = await params
          initRouteContext(routeCtx)
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // Spread-assembled object — variant not visible at call site
    {
      code: `
        async function Page({ params }) {
          const ctx = await params
          initRouteContext({ ...ctx })
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // variant bound to a string literal via simple assignment (concern 2)
    {
      code: `
        async function Page({ params }) {
          const variant = '~commercetools-set'
          const { locale } = await params
          initRouteContext({ variant, locale })
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // Module-scope literal binding is also caught
    {
      code: `
        const variant = '~mock-set'
        async function Page({ params }) {
          const { locale } = await params
          initRouteContext({ variant, locale })
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // A good call does not suppress a bad call in the same file (concern 3)
    {
      code: `
        async function generateMetadata({ params }) {
          const variant = '~commercetools-set'
          const { locale } = await params
          initRouteContext({ variant, locale })
        }
        async function Page({ params }) {
          const { variant, locale } = await params
          initRouteContext({ variant, locale })
        }
      `,
      errors: [{ messageId: 'badCall' }],
    },
    // Multiple bad calls: all are reported independently (concern 3)
    {
      code: `
        async function generateMetadata({ params }) {
          initRouteContext({ variant: '~mock-set', locale: 'en' })
        }
        async function Page({ params }) {
          initRouteContext({ variant: '~commercetools-set', locale: 'en' })
        }
      `,
      errors: [{ messageId: 'badCall' }, { messageId: 'badCall' }],
    },
  ],
})
