'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { PasswordInput } from '@/components/ui/inputs/password-input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { Checkbox } from '@/components/ui/checkbox'
import { useRegister } from './hooks/use-register'
import { RegisterRequestSchema } from '@core/contracts/auth/register'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toast, addToast } from '@/components/ui/toast'
import { HttpError } from '@/lib/error-utils'
import { z } from 'zod'
import { SALUTATION_OPTIONS } from '@config/constants'

const RegisterFormSchema = RegisterRequestSchema.extend({
  confirmPassword: z
    .string()
    .min(1, 'account.signUp.errors.confirmPasswordRequired'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'account.signUp.errors.passwordsDoNotMatch',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof RegisterFormSchema>

interface RegisterFormProps {
  onSuccess?: (emailToken?: string) => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations('account.signUp')
  const { registerMutation } = useRegister()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showErrorToast, setShowErrorToast] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      salutation: undefined,
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      acceptTerms: false,
    },
  })

  async function onSubmit(data: RegisterFormData) {
    const { confirmPassword, ...registerRequest } = data
    const result = await registerMutation.mutateAsync(registerRequest)
    if (!result.success) {
      setErrorMessage(
        HttpError.isTooManyRequestsError(result.error)
          ? t('errors.tooManyRequests')
          : t('errors.registerFailed')
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

    if (!response.success) {
      setErrorMessage(response.message ?? t('errors.internalServerError'))
      setShowErrorToast(true)
      return
    }

    addToast({
      type: 'success',
      children: t('success'),
    })
    onSuccess?.(response.emailToken)
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
          name='salutation'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <RadioGroup
                orientation='horizontal'
                value={field.value}
                onValueChange={field.onChange}
                className='gap-8'
              >
                {SALUTATION_OPTIONS.map((salutation) => (
                  <div
                    key={salutation}
                    className='flex items-center gap-3'
                  >
                    <RadioGroupItem
                      value={salutation}
                      id={`salutation-${salutation}`}
                      invalid={fieldState.invalid}
                    />
                    <label
                      htmlFor={`salutation-${salutation}`}
                      className='cursor-pointer text-base text-gray-700 capitalize'
                    >
                      {t(`salutationOptions.${salutation}`)}
                    </label>
                  </div>
                ))}
              </RadioGroup>
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <div className='flex flex-col gap-4'>
          <Controller
            name='firstName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='firstName'
                  label={t('firstNameLabel')}
                  required
                  autoComplete='given-name'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />

          <Controller
            name='lastName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='lastName'
                  label={t('lastNameLabel')}
                  required
                  autoComplete='family-name'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />
        </div>

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
          name='dateOfBirth'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='dateOfBirth'
                label={t('dateOfBirthLabel')}
                placeholder='YYYY-MM-DD'
                type='date'
                autoComplete='bday'
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

        <Controller
          name='acceptTerms'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className='flex items-start gap-3'>
                <Checkbox
                  id='acceptTerms'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  invalid={fieldState.invalid}
                />
                <label
                  htmlFor='acceptTerms'
                  className='flex-1 cursor-pointer text-sm/[1.6] text-gray-700'
                >
                  <span>{t('termsTextPrefix')}</span>
                  <Link
                    href={`/terms`}
                    className='underline'
                    target='_blank'
                  >
                    {t('termsLink')}
                  </Link>
                  <span>{t('termsTextMiddle')}</span>
                  <Link
                    href={`/privacy`}
                    className='underline'
                    target='_blank'
                  >
                    {t('privacyLink')}
                  </Link>
                  <span>{t('termsTextSuffix')}</span>
                </label>
              </div>
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <Button
          type='submit'
          disabled={form.formState.isSubmitting || registerMutation.isPending}
          className='w-full uppercase'
        >
          {form.formState.isSubmitting || registerMutation.isPending
            ? t('submitting')
            : t('submitButton')}
        </Button>
      </form>
    </div>
  )
}
