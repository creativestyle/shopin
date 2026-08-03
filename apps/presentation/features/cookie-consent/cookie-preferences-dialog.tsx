'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  CONSENT_CATEGORIES,
  allRejected,
  type ConsentCategories,
} from './cookie-consent-config'
import { useConsent } from './use-consent'

/**
 * Preferences modal with per-category toggles, reachable from the banner's
 * "Customise" action and from the footer trigger. Radix Dialog provides the
 * focus trap, Esc handling, and keyboard operability.
 */
export function CookiePreferencesDialog() {
  const {
    consentState,
    isPreferencesOpen,
    closePreferences,
    updateConsent,
    acceptAll,
  } = useConsent()

  return (
    <Dialog
      open={isPreferencesOpen}
      onOpenChange={(open) => {
        if (!open) {
          closePreferences()
        }
      }}
    >
      {/* Content mounts fresh on open, so the form seeds from the saved choice. */}
      {isPreferencesOpen && (
        <PreferencesForm
          initialCategories={consentState?.categories ?? allRejected()}
          onSave={updateConsent}
          onAcceptAll={acceptAll}
        />
      )}
    </Dialog>
  )
}

function PreferencesForm({
  initialCategories,
  onSave,
  onAcceptAll,
}: {
  initialCategories: ConsentCategories
  onSave: (categories: ConsentCategories) => void
  onAcceptAll: () => void
}) {
  const t = useTranslations('cookieConsent')
  const baseId = useId()
  const [selection, setSelection] =
    useState<ConsentCategories>(initialCategories)

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('preferences.title')}</DialogTitle>
      </DialogHeader>
      {/* tabIndex -1: content is short and fully reachable via the toggles/buttons,
          so the scrollable-region tab stop is unnecessary noise here. */}
      <DialogBody tabIndex={-1}>
        <DialogDescription>{t('preferences.description')}</DialogDescription>

        <ul className='flex flex-col gap-6'>
          {/* Essential — always on, cannot be toggled off. */}
          <li className='flex items-start justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <span
                id={`${baseId}-essential`}
                className='text-sm font-bold text-gray-950'
              >
                {t('categories.essential.name')}
              </span>
              <span className='text-sm text-gray-500'>
                {t('categories.essential.description')}
              </span>
            </div>
            <Switch
              checked
              disabled
              aria-labelledby={`${baseId}-essential`}
              aria-label={t('categories.essential.name')}
            />
          </li>

          {CONSENT_CATEGORIES.map((category) => {
            const labelId = `${baseId}-${category}`
            return (
              <li
                key={category}
                className='flex items-start justify-between gap-4'
              >
                <div className='flex flex-col gap-1'>
                  <span
                    id={labelId}
                    className='text-sm font-bold text-gray-950'
                  >
                    {t(`categories.${category}.name`)}
                  </span>
                  <span className='text-sm text-gray-500'>
                    {t(`categories.${category}.description`)}
                  </span>
                </div>
                <Switch
                  checked={selection[category]}
                  onCheckedChange={(checked) =>
                    setSelection((prev) => ({ ...prev, [category]: checked }))
                  }
                  aria-labelledby={labelId}
                  aria-label={t(`categories.${category}.name`)}
                />
              </li>
            )
          })}
        </ul>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-2 sm:flex-row sm:justify-end'>
        <Button
          variant='secondary'
          scheme='black'
          onClick={() => onSave(selection)}
        >
          {t('actions.savePreferences')}
        </Button>
        <Button
          variant='primary'
          scheme='black'
          onClick={onAcceptAll}
        >
          {t('actions.acceptAll')}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
