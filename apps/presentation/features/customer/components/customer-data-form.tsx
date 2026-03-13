'use client'

import { Field, FieldError } from '@/components/ui/field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { addToast } from '@/components/ui/toast'
import { useBffClientMutation } from '@/lib/bff/utils/mutations'
import { useCustomerService } from '../hooks/use-customer-service'
import { customerKeys } from '../customer-keys'
import {
  getCustomerDataFormDefaultValues,
  cleanCustomerData,
} from '../lib/customer-data-utils'
import {
  CustomerResponse,
  UpdateCustomerRequest,
  UpdateCustomerRequestSchema,
} from '@core/contracts/customer/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { FC, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { SALUTATION_OPTIONS } from '@config/constants'

interface ContactDataFormProps {
  customer: CustomerResponse
  onSuccess: () => void
  onStateChange?: (state: { isDirty: boolean; isPending: boolean }) => void
}

export const CustomerDataForm: FC<ContactDataFormProps> = ({
  customer,
  onSuccess,
  onStateChange,
}) => {
  const t = useTranslations('account.myAccount')
  const { customerService } = useCustomerService()
  const queryClient = useQueryClient()

  const updateMutation = useBffClientMutation({
    mutationFn: (data: UpdateCustomerRequest) =>
      customerService.updateCustomer(data),
    errorMessage: t('customerData.errors.general'),
    onSuccess: (data) => {
      queryClient.setQueryData(customerKeys.me(), data)
      addToast({
        type: 'success',
        children: t('customerData.updateSuccess'),
      })
      onSuccess()
    },
  })

  const form = useForm<UpdateCustomerRequest>({
    resolver: zodResolver(UpdateCustomerRequestSchema),
    defaultValues: getCustomerDataFormDefaultValues(customer),
  })

  async function onSubmit(data: UpdateCustomerRequest) {
    await updateMutation.mutateAsync(cleanCustomerData(data))
  }

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isDirty: form.formState.isDirty,
        isPending: updateMutation.isPending,
      })
    }
  }, [form.formState.isDirty, updateMutation.isPending, onStateChange])

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className='w-full space-y-4'
      id='customer-data-form'
    >
      <Controller
        name='salutation'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <span className='mb-2 text-sm font-medium text-gray-700'>
              {t('customerData.salutation')}
            </span>
            <RadioGroup
              id='salutation'
              orientation='horizontal'
              value={field.value}
              onValueChange={field.onChange}
              className='grid-flow-row gap-4 sm:grid-flow-col sm:gap-8'
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
                    {t(`customerData.salutationOptions.${salutation}`)}
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

      <Field>
        <Controller
          name='firstName'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='firstName'
                label={t('customerData.firstName')}
                required
                autoComplete='given-name'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />
      </Field>

      <Field>
        <Controller
          name='lastName'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='lastName'
                label={t('customerData.lastName')}
                required
                autoComplete='family-name'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />
      </Field>

      <Field>
        <Controller
          name='dateOfBirth'
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <TextInput
                {...field}
                id='dateOfBirth'
                label={t('customerData.dateOfBirth')}
                placeholder='YYYY-MM-DD'
                type='date'
                aria-invalid={!!fieldState.error}
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </>
          )}
        />
      </Field>
    </form>
  )
}
