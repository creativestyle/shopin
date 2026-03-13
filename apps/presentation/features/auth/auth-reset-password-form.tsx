'use client'

import { FC, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/inputs/password-input'
import { ResetPasswordRequestSchema } from '@core/contracts/auth/reset-password'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toast, addToast } from '@/components/ui/toast'
import { HttpError } from '@/lib/error-utils'
import { useResetPassword } from './hooks/use-reset-password'
import { z } from 'zod'
import { ErrorDisplay } from '@/components/ui/error-display'

const ResetPasswordFormSchema = ResetPasswordRequestSchema.omit({
  tokenValue: true,
})
  .extend({
    confirmPassword: z
      .string()
      .min(1, 'account.resetPassword.errors.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'account.resetPassword.errors.passwordsDoNotMatch',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof ResetPasswordFormSchema>

interface ResetPasswordFormProps {
  onSuccess?: () => void
}

export const ResetPasswordForm: FC<ResetPasswordFormProps> = ({
  onSuccess,
}) => {
  const t = useTranslations('account.resetPassword')
  const searchParams = useSearchParams()
  const { resetPasswordMutation } = useResetPassword()
  const [formError, setFormError] = useState<
    'invalidToken' | 'expiredToken' | 'tooManyRequests' | 'generic' | null
  >(null)
  const token = searchParams.get('token')

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const isPending =
    form.formState.isSubmitting || resetPasswordMutation.isPending

  const onSubmit = async (data: ResetPasswordFormData) => {
    setFormError(null)
    const { confirmPassword, ...resetRequest } = data
    const result = await resetPasswordMutation.mutateAsync({
      ...resetRequest,
      tokenValue: token!,
    })

    if (!result.success) {
      setFormError(
        HttpError.isTooManyRequestsError(result.error)
          ? 'tooManyRequests'
          : 'generic'
      )
      return
    }

    if (!result.data.success) {
      if (result.data.message === 'token_expired') {
        setFormError('expiredToken')
      } else if (result.data.statusCode === 400) {
        setFormError('invalidToken')
      } else {
        setFormError('generic')
      }
      return
    }

    addToast({
      type: 'success',
      children: t('success'),
    })
    onSuccess?.()
  }

  let tokenError = null
  if (!token) {
    tokenError = {
      message: t('errors.tokenRequired'),
      href: '/sign-in',
      label: t('backToSignIn'),
    }
  } else if (formError === 'expiredToken' || formError === 'invalidToken') {
    tokenError = {
      message: t(`errors.${formError}`),
      href: '/forgot-password',
      label: t('requestNewLink'),
    }
  }

  if (tokenError) {
    return (
      <div className='flex w-full flex-col items-center gap-4'>
        <ErrorDisplay
          className='text-center text-base'
          centered
        >
          {tokenError.message}
        </ErrorDisplay>
        <div className='my-4 w-full border-t border-gray-200' />
        <Link
          href={tokenError.href}
          className='text-center text-sm text-gray-700 underline transition-colors hover:text-gray-900'
        >
          {tokenError.label}
        </Link>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col content-stretch gap-6'>
      {!!formError && (
        <Toast
          type='error'
          withCloseButton={false}
          withIcon={false}
          className='max-w-full sm:max-w-full'
        >
          {formError === 'tooManyRequests'
            ? t('errors.tooManyRequests')
            : t('errors.resetPasswordFailed')}
        </Toast>
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex w-full flex-col content-stretch gap-6'
        noValidate
      >
        <Controller
          name='newPassword'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <PasswordInput
                {...field}
                id='newPassword'
                label={t('newPasswordLabel')}
                required
                autoComplete='new-password'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <Controller
          name='confirmPassword'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <PasswordInput
                {...field}
                id='confirmPassword'
                label={t('confirmPasswordLabel')}
                required
                autoComplete='new-password'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <Button
          type='submit'
          disabled={isPending}
          className='w-full uppercase'
        >
          {isPending ? t('submitting') : t('submitButton')}
        </Button>
      </form>
    </div>
  )
}
