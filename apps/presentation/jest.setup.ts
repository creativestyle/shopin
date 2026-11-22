import { jest } from '@jest/globals'
import '@testing-library/jest-dom'
import type { ReactNode } from 'react'

// Minimal next-intl mock for tests
jest.mock('next-intl', () => {
  const { createElement, Fragment } =
    jest.requireActual<typeof import('react')>('react')
  const useTranslations = (ns?: string) => {
    const t = (key: string) => (ns ? `${ns}.${key}` : key)
    // Renders each tag callback with the key as its chunks, so rich links are testable.
    t.rich = (key: string, values: Record<string, unknown> = {}) => {
      const tags = Object.values(values).filter(
        (value): value is (chunks: string) => ReactNode =>
          typeof value === 'function'
      )
      return tags.length === 0
        ? t(key)
        : createElement(Fragment, null, ...tags.map((tag) => tag(t(key))))
    }
    return t
  }
  const useLocale = () => 'en'
  return { useTranslations, useLocale }
})
