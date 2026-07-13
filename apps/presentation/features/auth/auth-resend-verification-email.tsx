'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useResendVerificationEmail } from './hooks/use-resend-verification-email'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { TextInput } from '@/components/ui/inputs/text-input'
// TODO: Remove once email service provider is configured.
import { TemporaryVerifyEmailButton } from './auth-temporary-verify-email-button'
import {
  ResendVerificationEmailRequestSchema,
  type ResendVerificationEmailRequest,
} from '@core/contracts/auth/resend-verification-email'

export function ResendVerificationEmailForm() {
  const t = useTranslations('account.registrationSuccess')
  const { resendVerificationEmailMutation } = useResendVerificationEmail()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(false)
  const [verifyEmailHref, setVerifyEmailHref] = useState<string | null>(null)

  const form = useForm<ResendVerificationEmailRequest>({
    mode: 'onTouched',
    resolver: zodResolver(ResendVerificationEmailRequestSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ResendVerificationEmailRequest) {
    setError(false)
    setVerifyEmailHref(null)
    const result = await resendVerificationEmailMutation.mutateAsync(data)
    if (!result.success) {
      setError(true)
      return
    }
    if (result.data.emailToken) {
      setVerifyEmailHref(
        `/sign-up/verify-email?token=${result.data.emailToken}`
      )
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className='flex w-full flex-col gap-4'>
        <p className='text-center text-sm text-gray-700'>
          {t('resendSuccess')}
        </p>
        {verifyEmailHref && (
          <TemporaryVerifyEmailButton
            href={verifyEmailHref}
            label={t('confirmButton')}
          />
        )}
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className='flex w-full flex-col gap-2'
      noValidate
    >
      <FormField
        name='email'
        control={form.control}
        render={({ field, validationState }) => (
          <TextInput
            {...field}
            id='resend-email'
            label={t('resendEmailLabel')}
            required
            autoComplete='email'
            validationState={validationState}
          />
        )}
      />
      {error && (
        <p className='text-sm text-red-600'>{t('errors.resendFailed')}</p>
      )}
      <Button
        type='submit'
        variant='primary'
        disabled={
          form.formState.isSubmitting ||
          resendVerificationEmailMutation.isPending
        }
      >
        {form.formState.isSubmitting ||
        resendVerificationEmailMutation.isPending
          ? t('resendPending')
          : t('resendButton')}
      </Button>
    </form>
  )
}
