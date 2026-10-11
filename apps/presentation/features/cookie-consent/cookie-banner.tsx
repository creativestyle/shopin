'use client'

import { useTranslations } from 'next-intl'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { useConsent } from './use-consent'

const noop = () => undefined

/**
 * First-visit cookie consent banner, shown as a centered modal card over a
 * dimming overlay. Radix moves focus into it on open and traps it; it cannot be
 * dismissed with Esc or an outside click — the visitor must choose accept,
 * reject, or customise. Hidden while the preferences dialog is open so the two
 * modals never stack.
 */
export function CookieBanner() {
  const t = useTranslations('cookieConsent')
  const {
    isBannerVisible,
    isPreferencesOpen,
    acceptAll,
    rejectNonEssential,
    openPreferences,
  } = useConsent()

  return (
    <DialogPrimitive.Root
      open={isBannerVisible && !isPreferencesOpen}
      onOpenChange={noop}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-(--z-modal) bg-gray-950/50' />
        <DialogPrimitive.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className='fixed top-[50dvh] left-[50vw] z-(--z-modal) flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-lg bg-white p-6 shadow-card'
        >
          <div className='flex flex-col gap-2'>
            <DialogPrimitive.Title className='text-lg font-semibold text-gray-950'>
              {t('banner.title')}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className='text-sm text-gray-600'>
              {t('banner.description')}
            </DialogPrimitive.Description>
          </div>
          <div className='flex flex-col gap-2 sm:flex-row-reverse'>
            <Button
              variant='primary'
              scheme='black'
              className='sm:flex-1'
              onClick={acceptAll}
            >
              {t('actions.acceptAll')}
            </Button>
            <Button
              variant='secondary'
              scheme='black'
              className='sm:flex-1'
              onClick={rejectNonEssential}
            >
              {t('actions.essentialOnly')}
            </Button>
            <Button
              variant='tertiary'
              scheme='black'
              onClick={openPreferences}
            >
              {t('actions.customise')}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
