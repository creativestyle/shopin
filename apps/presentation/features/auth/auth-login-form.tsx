'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { PasswordInput } from '@/components/ui/inputs/password-input'
import {
  LoginRequestSchema,
  type LoginRequest,
} from '@core/contracts/auth/login'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toast, addToast } from '@/components/ui/toast'
import { HttpError } from '@/lib/error-utils'
import { useLogin } from './hooks/use-login'
import { useResendVerificationEmail } from './hooks/use-resend-verification-email'
// TODO: Remove once email service provider is configured.
import { TemporaryVerifyEmailButton } from './auth-temporary-verify-email-button'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('account.signIn')
  const { loginMutation } = useLogin()
  const { resendVerificationEmailMutation } = useResendVerificationEmail()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [verifyEmailHref, setVerifyEmailHref] = useState<string | null>(null)

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginRequest) {
    setEmailNotVerified(false)
    setVerifyEmailHref(null)
    const result = await loginMutation.mutateAsync(data)
    if (!result.success) {
      setErrorMessage(
        HttpError.isTooManyRequestsError(result.error)
          ? t('errors.tooManyRequests')
          : t('errors.loginFailed')
      )
      setShowErrorToast(true)
      return
    }
    const response = result.data
    if (
      !response.success &&
      response.errorTranslationKey === 'errors.emailNotVerified'
    ) {
      setEmailNotVerified(true)
      return
    }
    if (!response.success && response.errorTranslationKey) {
      setErrorMessage(
        t(response.errorTranslationKey as Parameters<typeof t>[0])
      )
      setShowErrorToast(true)
      return
    }

    addToast({
      type: 'success',
      children: t('success'),
    })
    onSuccess?.()
  }

  async function onResendVerificationEmail() {
    const email = form.getValues('email')
    const result = await resendVerificationEmailMutation.mutateAsync({ email })
    if (!result.success) {
      addToast({
        type: 'error',
        children: HttpError.isTooManyRequestsError(result.error)
          ? t('errors.tooManyRequests')
          : t('errors.resendFailed'),
      })
      return
    }
    if (result.data.emailToken) {
      setVerifyEmailHref(
        `/sign-up/verify-email?token=${result.data.emailToken}`
      )
    }
  }

  return (
    <div className='flex w-full flex-col content-stretch gap-6'>
      {emailNotVerified && (
        <div className='flex flex-col gap-3'>
          <Toast
            type='error'
            withCloseButton={false}
            withIcon={false}
            className='max-w-full sm:max-w-full'
          >
            <div className='flex flex-col gap-2'>
              <span>{t('errors.emailNotVerified')}</span>
              {!verifyEmailHref && (
                <Button
                  type='button'
                  variant='tertiary'
                  className='h-auto justify-start p-0 text-sm underline'
                  disabled={resendVerificationEmailMutation.isPending}
                  onClick={onResendVerificationEmail}
                >
                  {resendVerificationEmailMutation.isPending
                    ? t('resendPending')
                    : t('resendButton')}
                </Button>
              )}
            </div>
          </Toast>
          {verifyEmailHref && (
            <TemporaryVerifyEmailButton
              href={verifyEmailHref}
              label={t('verifyEmailButton')}
            />
          )}
        </div>
      )}
      {showErrorToast && errorMessage && (
        <Toast
          type='error'
          withCloseButton={false}
          withIcon={false}
          className='max-w-full sm:max-w-full'
        >
          {errorMessage}
        </Toast>
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col content-stretch gap-6'
        noValidate
      >
        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='email'
                label={t('emailLabel')}
                required
                autoComplete='email'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <Controller
          name='password'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <PasswordInput
                {...field}
                id='password'
                label={t('passwordLabel')}
                required
                autoComplete='current-password'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <div className='flex justify-end'>
          <Link
            href='/forgot-password'
            className='text-sm text-gray-700 underline hover:text-gray-950'
          >
            {t('forgotPassword')}
          </Link>
        </div>

        <Button
          type='submit'
          disabled={form.formState.isSubmitting || loginMutation.isPending}
          className='w-full uppercase'
        >
          {form.formState.isSubmitting || loginMutation.isPending
            ? t('submitting')
            : t('submitButton')}
        </Button>
      </form>
    </div>
  )
}
