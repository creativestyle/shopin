'use client'

import { FC, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { ForgotPasswordRequestSchema } from '@core/contracts/auth/forgot-password'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toast } from '@/components/ui/toast'
import { HttpError } from '@/lib/error-utils'
import { useForgotPassword } from './hooks/use-forgot-password'
import { z } from 'zod'

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordRequestSchema>

interface ForgotPasswordFormProps {
  onSuccess?: (passwordResetToken?: string) => void
}

export const ForgotPasswordForm: FC<ForgotPasswordFormProps> = ({
  onSuccess,
}) => {
  const t = useTranslations('account.forgotPassword')
  const { forgotPasswordMutation } = useForgotPassword()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const result = await forgotPasswordMutation.mutateAsync(data)

    if (!result.success) {
      // Mutation threw (rate limit, network error)
      setErrorMessage(
        HttpError.isTooManyRequestsError(result.error)
          ? t('errors.tooManyRequests')
          : t('errors.forgotPasswordFailed')
      )
      setShowErrorToast(true)
      return
    }

    // Always navigate to success regardless of whether the email was found.
    // Prevents email enumeration — success page says "If an account exists, you'll receive a link."
    onSuccess?.(result.data.passwordResetToken)
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

        <Button
          type='submit'
          disabled={
            form.formState.isSubmitting || forgotPasswordMutation.isPending
          }
          className='w-full uppercase'
        >
          {form.formState.isSubmitting || forgotPasswordMutation.isPending
            ? t('submitting')
            : t('submitButton')}
        </Button>
      </form>
    </div>
  )
}
