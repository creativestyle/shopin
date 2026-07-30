'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/navigation'
import { DateInput } from '@/components/ui/inputs/date-input'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Expandable details shown when "Kauf auf Rechnung" (invoice) is selected:
 * legal text, a birthday input, and a consent checkbox with a privacy link.
 */
export function PaymentInvoiceDetails() {
  const t = useTranslations('checkout.payment.invoice')
  const birthdayId = useId()
  const consentId = useId()
  const consentLabelId = `${consentId}-label`

  const [birthday, setBirthday] = useState('')
  const [consent, setConsent] = useState(false)

  return (
    <div className='flex flex-col gap-4 lg:px-8'>
      <p className='text-sm/[1.6] text-gray-700'>{t('description')}</p>

      <DateInput
        id={birthdayId}
        name='invoice-birthday'
        label={t('birthdayLabel')}
        value={birthday}
        onChange={(event) => setBirthday(event.target.value)}
      />

      <label className='flex cursor-pointer items-start gap-3'>
        <Checkbox
          id={consentId}
          aria-labelledby={consentLabelId}
          checked={consent}
          onCheckedChange={(checked) => setConsent(checked === true)}
          className='mt-0.5 shrink-0'
        />
        <span
          id={consentLabelId}
          className='flex flex-1 flex-col gap-1 text-sm/[1.6] text-gray-700'
        >
          <span>{t('consent')}</span>
          <span className='text-gray-600'>
            {t.rich('privacyNotice', {
              privacy: (chunks) => (
                <Link
                  href='/privacy'
                  className='underline hover:text-gray-950'
                  // Keep clicks on the link from toggling the checkbox.
                  onClick={(event) => event.stopPropagation()}
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </span>
      </label>
    </div>
  )
}
