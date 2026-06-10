'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { FormField } from '@/components/ui/form-field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { DateInput } from '@/components/ui/inputs/date-input'
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
    mode: 'onTouched',
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
                  <label
                    key={salutation}
                    className='flex cursor-pointer items-center gap-3'
                  >
                    <RadioGroupItem
                      value={salutation}
                      id={`salutation-${salutation}`}
                      aria-labelledby={`salutation-${salutation}-label`}
                      invalid={fieldState.invalid}
                    />
                    <span
                      id={`salutation-${salutation}-label`}
                      className='text-base text-gray-700 capitalize'
                    >
                      {t(`salutationOptions.${salutation}`)}
                    </span>
                  </label>
                ))}
              </RadioGroup>
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <div className='flex flex-col gap-4'>
          <FormField
            name='firstName'
            control={form.control}
            render={({ field, validationState }) => (
              <TextInput
                {...field}
                id='firstName'
                label={t('firstNameLabel')}
                required
                autoComplete='given-name'
                validationState={validationState}
              />
            )}
          />

          <FormField
            name='lastName'
            control={form.control}
            render={({ field, validationState }) => (
              <TextInput
                {...field}
                id='lastName'
                label={t('lastNameLabel')}
                required
                autoComplete='family-name'
                validationState={validationState}
              />
            )}
          />
        </div>

        <FormField
          name='email'
          control={form.control}
          render={({ field, validationState }) => (
            <TextInput
              {...field}
              id='email'
              label={t('emailLabel')}
              required
              autoComplete='email'
              validationState={validationState}
            />
          )}
        />

        <FormField
          name='dateOfBirth'
          control={form.control}
          render={({ field, validationState }) => (
            <DateInput
              {...field}
              id='dateOfBirth'
              label={t('dateOfBirthLabel')}
              autoComplete='bday'
              validationState={validationState}
            />
          )}
        />

        <FormField
          name='password'
          control={form.control}
          render={({ field, validationState }) => (
            <PasswordInput
              {...field}
              id='password'
              label={t('passwordLabel')}
              required
              autoComplete='new-password'
              validationState={validationState}
            />
          )}
        />

        <FormField
          name='confirmPassword'
          control={form.control}
          render={({ field, validationState }) => (
            <PasswordInput
              {...field}
              id='confirmPassword'
              label={t('confirmPasswordLabel')}
              required
              autoComplete='new-password'
              validationState={validationState}
            />
          )}
        />

        <Controller
          name='acceptTerms'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <label className='flex cursor-pointer items-start gap-3'>
                <Checkbox
                  id='acceptTerms'
                  aria-labelledby='acceptTerms-label'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  invalid={fieldState.invalid}
                />
                <span
                  id='acceptTerms-label'
                  className='flex-1 text-sm/[1.6] text-gray-700'
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
                </span>
              </label>
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
