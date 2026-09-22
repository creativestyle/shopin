'use client'

import { Field, FieldError } from '@/components/ui/field'
import { FormField } from '@/components/ui/form-field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { DateInput } from '@/components/ui/inputs/date-input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { useUpdateCustomer } from '../hooks/use-update-customer'
import { HttpError } from '@/lib/error-utils'
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

  const form = useForm<UpdateCustomerRequest>({
    mode: 'onTouched',
    resolver: zodResolver(UpdateCustomerRequestSchema),
    defaultValues: getCustomerDataFormDefaultValues(customer),
  })

  const { updateCustomer, isUpdateCustomerPending } = useUpdateCustomer({
    onSuccess,
  })

  async function onSubmit(data: UpdateCustomerRequest) {
    const result = await updateCustomer(cleanCustomerData(data))

    if (!result.success && HttpError.isConflictError(result.error)) {
      form.setError('email', {
        type: 'server',
        message: 'account.myAccount.customerData.errors.emailInUse',
      })
      form.setFocus('email')
    }
  }

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isDirty: form.formState.isDirty,
        isPending: isUpdateCustomerPending,
      })
    }
  }, [form.formState.isDirty, isUpdateCustomerPending, onStateChange])

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
            <span
              id='salutation-label'
              className='mb-2 text-sm font-medium text-gray-700'
            >
              {t('customerData.salutation')}
            </span>
            <RadioGroup
              id='salutation'
              orientation='horizontal'
              value={field.value}
              onValueChange={field.onChange}
              aria-labelledby='salutation-label'
              invalid={fieldState.invalid}
              className='grid-flow-row gap-4 sm:grid-flow-col sm:gap-8'
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
                    {t(`customerData.salutationOptions.${salutation}`)}
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

      <FormField
        name='email'
        control={form.control}
        render={({ field, validationState }) => (
          <TextInput
            {...field}
            id='email'
            label={t('customerData.email')}
            required
            autoComplete='email'
            validationState={validationState}
          />
        )}
      />

      <FormField
        name='firstName'
        control={form.control}
        render={({ field, validationState }) => (
          <TextInput
            {...field}
            id='firstName'
            label={t('customerData.firstName')}
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
            label={t('customerData.lastName')}
            required
            autoComplete='family-name'
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
            label={t('customerData.dateOfBirth')}
            autoComplete='bday'
            validationState={validationState}
          />
        )}
      />
    </form>
  )
}
