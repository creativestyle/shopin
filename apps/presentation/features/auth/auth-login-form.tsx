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

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('account.signIn')
  const { loginMutation } = useLogin()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)

  const form = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginRequest) {
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

  return (
    <div className='flex w-full flex-col content-stretch gap-6'>
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
