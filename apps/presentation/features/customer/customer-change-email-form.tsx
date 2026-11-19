'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FormField } from '@/components/ui/form-field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { PasswordInput } from '@/components/ui/inputs/password-input'
import { Toast } from '@/components/ui/toast'
// TODO: Remove once email service provider is configured.
import { TemporaryVerifyEmailButton } from '@/features/auth/auth-temporary-verify-email-button'
import { useChangeEmail } from './hooks/use-change-email'
import { InvalidCurrentPasswordError } from './lib/invalid-current-password-error'
import { EmailInUseError } from './lib/email-in-use-error'
import {
  ChangeCustomerEmailRequest,
  ChangeCustomerEmailRequestSchema,
} from '@core/contracts/customer/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'

interface PendingVerification {
  verifyEmailHref?: string
}

export const ChangeEmailForm: FC = () => {
  const t = useTranslations('account.myAccount.changeEmail')
  const { handleEmailChange, isEmailChangePending } = useChangeEmail()
  const [pendingVerification, setPendingVerification] =
    useState<PendingVerification | null>(null)

  const form = useForm<ChangeCustomerEmailRequest>({
    mode: 'onTouched',
    resolver: zodResolver(ChangeCustomerEmailRequestSchema),
    defaultValues: {
      email: '',
      currentPassword: '',
    },
  })

  async function onSubmit(data: ChangeCustomerEmailRequest) {
    const result = await handleEmailChange(data)

    if (result.success) {
      form.reset()
      const { customer, emailToken } = result.data
      setPendingVerification(
        customer.isEmailVerified === false
          ? {
              verifyEmailHref: emailToken
                ? `/sign-up/verify-email?token=${emailToken}`
                : undefined,
            }
          : null
      )
      return
    }

    if (result.error instanceof InvalidCurrentPasswordError) {
      form.setError(
        'currentPassword',
        {
          type: 'server',
          message: 'account.myAccount.changeEmail.errors.wrongCurrentPassword',
        },
        { shouldFocus: true }
      )
    } else if (result.error instanceof EmailInUseError) {
      form.setError(
        'email',
        {
          type: 'server',
          message: 'account.myAccount.changeEmail.errors.emailInUse',
        },
        { shouldFocus: true }
      )
    }
  }

  return (
    <Card
      scheme='gray'
      className='xl:w-1/2'
    >
      <h3 className='mb-4 text-lg font-bold'>{t('title')}</h3>
      <p className='mb-6 text-sm text-gray-600'>{t('description')}</p>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4'
      >
        <FormField
          name='email'
          control={form.control}
          render={({ field, validationState }) => (
            <TextInput
              {...field}
              id='newEmail'
              type='email'
              label={t('newEmail')}
              required
              autoComplete='email'
              validationState={validationState}
            />
          )}
        />

        <FormField
          name='currentPassword'
          control={form.control}
          render={({ field, validationState }) => (
            <PasswordInput
              {...field}
              id='changeEmailCurrentPassword'
              label={t('currentPassword')}
              required
              autoComplete='current-password'
              validationState={validationState}
            />
          )}
        />

        <Button
          type='submit'
          className='w-full'
          disabled={isEmailChangePending || !form.formState.isDirty}
        >
          {isEmailChangePending ? t('saving') : t('submitButtonLabel')}
        </Button>
      </form>

      {pendingVerification && (
        <div className='mt-6 flex flex-col gap-4'>
          <Toast
            type='info'
            withCloseButton={false}
            withIcon={false}
            className='max-w-full sm:max-w-full'
          >
            {t('verifyNotice')}
          </Toast>
          {pendingVerification.verifyEmailHref && (
            <TemporaryVerifyEmailButton
              href={pendingVerification.verifyEmailHref}
              label={t('verifyEmailButton')}
            />
          )}
        </div>
      )}
    </Card>
  )
}
