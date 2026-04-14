'use client'

import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import {
  acknowledgeDemoDisclaimer,
  hasAcknowledgedDemoDisclaimer,
} from './cookies.js'

type SupportedLocale = 'en' | 'de'

const LANGUAGE_TOGGLE_LOCALES = [
  'en',
  'de',
] as const satisfies readonly SupportedLocale[]

const TRANSLATIONS = {
  en: {
    title: 'Demo Store Notice',
    intro:
      'Welcome to the SHOPin Accelerator Demo. This is a sandbox environment for demonstration purposes only.',
    sections: [
      {
        label: 'Fictional Content',
        text: 'All products, descriptions, prices, and images shown in this store are purely fictional and for illustrative purposes. They do not constitute an offer to sell.',
      },
      {
        label: 'No Real Transactions',
        text: 'No real orders will be fulfilled, no payments processed, and no shipping will occur.',
      },
      {
        label: 'Data Safety',
        text: 'Do not enter real credit card numbers, actual addresses, or any sensitive personal information.',
      },
      {
        label: 'Liability',
        text: null,
      },
    ],
    liabilityPrefix: 'This demo is provided "as-is" by',
    liabilitySuffix: '.',
    furtherDetails: 'For further details, see our',
    privacy: 'Data Privacy',
    and: 'and',
    legal: 'Legal Notice',
    acknowledgement:
      'By clicking "Acknowledge & Enter Demo" or following the legal links above, you acknowledge the non-commercial, fictional nature of this store and its content.',
    dontShowAgain: "Don't show this notice again for 30 days",
    accept: 'Acknowledge & Enter Demo',
  },
  de: {
    title: 'Wichtiger Hinweis zur Demo-Umgebung',
    intro:
      'Willkommen zur SHOPin Accelerator Demo. Dies ist eine Sandbox-Umgebung, die ausschließlich zu Demonstrations- und Testzwecken dient.',
    sections: [
      {
        label: 'Fiktive Inhalte',
        text: 'Alle angezeigten Produkte, Beschreibungen, Preise und Bilder sind rein fiktiv und dienen lediglich der Veranschaulichung. Sie stellen kein rechtlich bindendes Verkaufsangebot dar.',
      },
      {
        label: 'Kein Geschäftsverkehr',
        text: 'Es werden keine realen Bestellungen ausgeführt, keine Zahlungen abgewickelt und kein Versand veranlasst. Es kommen keine Kaufverträge zustande.',
      },
      {
        label: 'Datensicherheit',
        text: 'Bitte geben Sie keine echten Kreditkartendaten, Privatadressen oder sensiblen personenbezogenen Daten ein.',
      },
      {
        label: 'Haftung',
        text: null,
      },
    ],
    liabilityPrefix: 'Diese Demo wird von',
    liabilitySuffix: 'ohne Gewährleistung bereitgestellt.',
    furtherDetails: 'Weitere Informationen finden Sie unter',
    privacy: 'Datenschutz',
    and: 'und',
    legal: 'Impressum',
    acknowledgement:
      'Durch Klicken auf „Bestätigen & Demo starten" oder durch Aufrufen der oben genannten rechtlichen Links bestätigen Sie, dass Sie über den nicht-kommerziellen, fiktiven Charakter dieses Shops und seiner Inhalte informiert wurden.',
    dontShowAgain: 'Diesen Hinweis 30 Tage lang nicht mehr anzeigen',
    accept: 'Bestätigen & Demo starten',
  },
}

function resolveLocale(locale: string): SupportedLocale {
  return locale.startsWith('de') ? 'de' : 'en'
}

export function DemoDisclaimerModal() {
  const appLocale = useLocale()
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<SupportedLocale>(resolveLocale(appLocale))
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const t = TRANSLATIONS[lang]

  useEffect(() => {
    if (!hasAcknowledgedDemoDisclaimer()) {
      setOpen(true)
    }
  }, [])

  const handleAccept = () => {
    if (dontShowAgain) {
      acknowledgeDemoDisclaimer()
    }
    setOpen(false)
  }

  const handleLegalLinkClick = () => {
    if (dontShowAgain) {
      acknowledgeDemoDisclaimer()
    }
  }

  const handleDialogOpenChange = (next: boolean) => {
    // Prevent closing without acknowledgment
    if (!next) {
      return
    }
    setOpen(next)
  }

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={handleDialogOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-(--z-modal) bg-gray-950/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0' />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className='fixed top-1/2 left-1/2 z-(--z-modal) w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-card data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        >
          {/* Language toggle */}
          <div className='flex justify-end gap-1 px-6 pt-4'>
            {LANGUAGE_TOGGLE_LOCALES.map((code) => (
              <button
                key={code}
                type='button'
                onClick={() => setLang(code)}
                className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  lang === code
                    ? 'bg-gray-950 text-white'
                    : 'text-gray-500 hover:text-gray-950'
                }`}
                aria-pressed={lang === code}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Header */}
          <div className='px-6 pb-4 pt-2'>
            <DialogPrimitive.Title className='text-lg font-semibold text-gray-950'>
              {t.title}
            </DialogPrimitive.Title>
          </div>

          {/* Body */}
          <DialogPrimitive.Description asChild>
            <div className='space-y-3 overflow-y-auto px-6 text-sm text-gray-600'>
              <p>{t.intro}</p>
              <ul className='space-y-2'>
                {t.sections.map(({ label, text }) => (
                  <li key={label}>
                    <span className='font-semibold text-gray-950'>
                      {label}:{' '}
                    </span>
                    {text ?? (
                      <>
                        {t.liabilityPrefix}{' '}
                        <a
                          href='https://shopin.dev'
                          target='_blank'
                          rel='noopener noreferrer'
                          className='underline hover:no-underline'
                        >
                          shopin.dev
                        </a>{' '}
                        {t.liabilitySuffix}
                      </>
                    )}
                  </li>
                ))}
              </ul>
              <p>
                {t.furtherDetails}{' '}
                <a
                  href='/privacy'
                  className='underline hover:no-underline'
                  onClick={handleLegalLinkClick}
                >
                  {t.privacy}
                </a>{' '}
                {t.and}{' '}
                <a
                  href='/imprint'
                  className='underline hover:no-underline'
                  onClick={handleLegalLinkClick}
                >
                  {t.legal}
                </a>
                .
              </p>
              <p className='text-xs italic text-gray-400'>
                {t.acknowledgement}
              </p>
            </div>
          </DialogPrimitive.Description>

          {/* Footer */}
          <div className='space-y-4 px-6 pb-6 pt-6'>
            <label className='flex cursor-pointer items-center gap-3 text-sm text-gray-600'>
              <CheckboxPrimitive.Root
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked === true)
                }
                className='size-5 shrink-0 cursor-pointer rounded border border-gray-300 bg-white outline-none transition-colors duration-150 hover:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary'
              >
                <CheckboxPrimitive.Indicator className='flex items-center justify-center text-white'>
                  <svg
                    viewBox='0 0 18 18'
                    fill='none'
                    className='size-4'
                    aria-hidden='true'
                  >
                    <path
                      d='M3 9l4.5 4.5L15 5'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </CheckboxPrimitive.Indicator>
              </CheckboxPrimitive.Root>
              {t.dontShowAgain}
            </label>
            <button
              onClick={handleAccept}
              className='inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-primary px-7 text-sm font-bold text-white transition-colors hover:bg-secondary active:bg-secondary'
            >
              {t.accept}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
