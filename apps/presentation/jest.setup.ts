import { jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Minimal next-intl mock for tests
jest.mock('next-intl', () => {
  const useTranslations = (ns?: string) => (key: string) =>
    ns ? `${ns}.${key}` : key
  const useLocale = () => 'en'
  return { useTranslations, useLocale }
})
