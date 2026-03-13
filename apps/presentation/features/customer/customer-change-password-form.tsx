'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field, FieldError } from '@/components/ui/field'
import { PasswordInput } from '@/components/ui/inputs/password-input'
import { useChangePassword } from './hooks/use-change-password'
import { ChangeCustomerPasswordRequestSchema } from '@core/contracts/customer/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const ChangePasswordFormSchema = ChangeCustomerPasswordRequestSchema.extend({
  confirmNewPassword: z
    .string()
    .min(1, 'account.myAccount.changePassword.errors.confirmPasswordRequired'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'account.myAccount.changePassword.errors.passwordsDoNotMatch',
  path: ['confirmNewPassword'],
})

type ChangePasswordFormData = z.infer<typeof ChangePasswordFormSchema>

export const ChangePasswordForm: FC = () => {
  const t = useTranslations('account.myAccount.changePassword')
  const { handlePasswordChange, isPasswordChangePending } = useChangePassword()

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  async function onSubmit(data: ChangePasswordFormData) {
    await handlePasswordChange(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          form.reset()
        },
      }
    )
  }

  return (
    <Card
      scheme='gray'
      className='xl:w-1/2'
    >
      <h3 className='mb-4 text-lg font-bold'>{t('changePasswordTitle')}</h3>
      <p className='mb-6 text-sm text-gray-600'>
        {t('changePasswordDescription')}
      </p>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4'
      >
        <Controller
          name='currentPassword'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <PasswordInput
                {...field}
                id='currentPassword'
                label={t('currentPassword')}
                required
                autoComplete='current-password'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <Controller
          name='newPassword'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <PasswordInput
                {...field}
                id='newPassword'
                label={t('newPassword')}
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
          name='confirmNewPassword'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <PasswordInput
                {...field}
                id='confirmNewPassword'
                label={t('confirmNewPassword')}
                required
                autoComplete='new-password'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />

        <div className='flex gap-2'>
          <Button
            type='submit'
            className='w-full'
            disabled={isPasswordChangePending || !form.formState.isDirty}
          >
            {isPasswordChangePending ? t('saving') : t('submitButtonLabel')}
          </Button>
        </div>
      </form>
    </Card>
  )
}
