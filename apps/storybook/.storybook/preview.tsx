import type { Preview } from '@storybook/react'
import React from 'react'
import { createNavigation } from '@storybook/nextjs/navigation.mock'
import { createRouter } from '@storybook/nextjs/router.mock'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NextIntlClientProvider } from 'next-intl'
import { Toaster } from 'sonner'
import defaultMessages from '../../../core/i18n/en-US.json'
import '../src/style.css'

// Initialize Next.js router/navigation mocks for stories using next/navigation
createNavigation({})
createRouter({})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: 'alphabetical',
        locales: 'en-US',
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
          <QueryClientProvider client={queryClient}>
            <Story />
            <Toaster />
          </QueryClientProvider>
        </NextIntlClientProvider>
      )
    },
  ],
}

export default preview
