'use client'

import { useId, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { TextInput } from '@/components/ui/inputs/text-input'
import { usePromoCode } from '../hooks/use-promo-code'
import type { DiscountCodeResponse } from '@core/contracts/cart/cart'

interface PromoCodeSectionProps {
  label: string
  appliedCodes?: DiscountCodeResponse[]
}

export function PromoCodeSection({
  label,
  appliedCodes,
}: PromoCodeSectionProps) {
  const t = useTranslations('cart.promoCode')
  const inputId = useId()
  const [code, setCode] = useState('')
  const {
    applyCode,
    removeCode,
    isApplying,
    isRemoving,
    feedback,
    clearFeedback,
  } = usePromoCode()

  const appliedCode = appliedCodes?.[0]

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed || isApplying) {
      return
    }

    const result = await applyCode({ code: trimmed })
    if (result.success) {
      setCode('')
    }
  }

  return (
    <Accordion
      type='single'
      collapsible
      // Open by default so an active code stays visible without extra interaction.
      defaultValue={appliedCode ? 'promo-code' : undefined}
    >
      <AccordionItem
        value='promo-code'
        className='border-0'
      >
        <AccordionTrigger className='p-0 text-sm/[1.6] font-normal text-gray-700 normal-case underline'>
          {label}
        </AccordionTrigger>
        <AccordionContent className='pt-2 pb-0'>
          {appliedCode ? (
            <div className='flex items-center justify-between gap-4'>
              <span className='text-sm text-gray-950'>
                {t('applied', { code: appliedCode.code })}
              </span>
              <Button
                type='button'
                variant='tertiary'
                disabled={isRemoving}
                aria-label={t('removeAriaLabel', { code: appliedCode.code })}
                onClick={() => removeCode({ discountCodeId: appliedCode.id })}
              >
                {t('remove')}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className='flex w-full items-end gap-3'
              noValidate
            >
              <div className='flex-1'>
                <Label
                  htmlFor={inputId}
                  className='mb-1 text-sm text-gray-700'
                >
                  {t('label')}
                </Label>
                {/* label='' disables the floating label, which needs more height than 48px. */}
                <TextInput
                  id={inputId}
                  name='promoCode'
                  label=''
                  placeholder={t('placeholder')}
                  value={code}
                  autoComplete='off'
                  validationState={
                    feedback?.type === 'error' ? 'error' : 'none'
                  }
                  disabled={isApplying}
                  // Inset ring: the accordion content clips overflow, so an outset ring is cut off.
                  className='h-12 rounded-full py-0 placeholder-gray-400 data-[keyboard-focus]:ring-offset-0 data-[keyboard-focus]:ring-inset'
                  onChange={(event) => {
                    setCode(event.target.value)
                    if (feedback) {
                      clearFeedback()
                    }
                  }}
                />
              </div>
              {/* Secondary styling so it doesn't read as the checkout CTA. */}
              <Button
                type='submit'
                variant='secondary'
                scheme='black'
                className='focus-visible:ring-inset'
                disabled={isApplying || code.trim().length === 0}
              >
                {t('apply')}
              </Button>
            </form>
          )}

          {/* Rendered unconditionally so assistive tech announces text changes. */}
          <p
            role='status'
            aria-live='polite'
            className='mt-2 text-sm text-green-700 empty:mt-0'
          >
            {feedback?.type === 'success' ? feedback.message : ''}
          </p>
          <p
            role='alert'
            className='mt-2 text-sm text-red-600 empty:mt-0'
          >
            {feedback?.type === 'error' ? feedback.message : ''}
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
