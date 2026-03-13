import type { Preview } from '@storybook/react'
import React from 'react'
import { createNavigation } from '@storybook/nextjs/navigation.mock'
import { createRouter } from '@storybook/nextjs/router.mock'
import { NextIntlClientProvider } from 'next-intl'
import { Toaster } from 'sonner'
import defaultMessages from '../../../core/i18n/en-US.json'
import '../src/style.css'

// Initialize Next.js router/navigation mocks for stories using next/navigation
createNavigation({})
createRouter({})

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story: React.ComponentType) => {
      return (
        <NextIntlClientProvider
          locale='en-US'
          messages={defaultMessages}
        >
          <Story />
          <Toaster />
        </NextIntlClientProvider>
      )
    },
  ],
}

export default preview
