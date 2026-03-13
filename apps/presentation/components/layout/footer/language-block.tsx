import type { FooterLanguage } from '@core/contracts/content/layout'
import { LocaleSwitcher } from '../locale-switcher'

export function LanguageBlock({ language }: { language: FooterLanguage }) {
  return (
    <div className='space-y-4'>
      <h3 className='text-sm leading-tight font-bold text-gray-900'>
        {language.title}
      </h3>
      <LocaleSwitcher />
    </div>
  )
}
