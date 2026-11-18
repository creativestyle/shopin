import { jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Minimal next-intl mock for tests
jest.mock('next-intl', () => {
  const useTranslations = (ns?: string) => {
    const t = (key: string) => (ns ? `${ns}.${key}` : key)
    t.rich = t
    return t
  }
  const useLocale = () => 'en'
  return { useTranslations, useLocale }
})
