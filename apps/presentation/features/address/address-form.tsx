'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useStoreConfig } from '@/features/store-config/store-config-provider'
import { Field, FieldError } from '@/components/ui/field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { Select } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { SALUTATION_OPTIONS } from '@config/constants'
import { getCountryLabel } from '@/features/store-config/store-config-utils'
import {
  AddressBaseSchema,
  type AddressBase,
} from '@core/contracts/address/address-base'
import PlusIcon from '@/public/icons/plus.svg'
import { Checkbox } from '@/components/ui/checkbox'

export interface AddressFormState {
  isDirty: boolean
  isPending?: boolean
}

export interface AddressFormProps {
  /**
   * Form submission handler
   */
  onSubmit?: (data: AddressBase) => void | Promise<void>
  /**
   * Default values for the form
   */
  defaultValues?: AddressBase
  /**
   * Form ID for external form submission
   */
  formId?: string
  /**
   * Whether to show checkboxes for setting default shipping/billing addresses
   * Should be true when used in customer account area
   */
  showDefaultAddressOptions?: boolean
  /**
   * Callback to notify parent component of form state changes
   */
  onStateChange?: (state: AddressFormState) => void
}

export function AddressForm({
  onSubmit,
  defaultValues,
  formId,
  showDefaultAddressOptions = false,
  onStateChange,
}: AddressFormProps) {
  const t = useTranslations('address.form')
  const tCommon = useTranslations('common')
  const { storeConfig } = useStoreConfig()
  const [showAdditionalStreetInfo, setShowAdditionalStreetInfo] = useState(
    () => !!defaultValues?.additionalStreetInfo
  )

  const form = useForm<AddressBase>({
    resolver: zodResolver(AddressBaseSchema),
    defaultValues: defaultValues || {},
  })

  // Notify parent of form state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isDirty: form.formState.isDirty,
      })
    }
  }, [form.formState.isDirty, onStateChange])

  return (
    <form
      onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
      className='w-full space-y-4'
      id={formId}
    >
      {/* Salutation/Gender Selection */}
      <Field>
        <Controller
          name='salutation'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className='space-y-2'>
                <RadioGroup
                  id='salutation'
                  orientation='horizontal'
                  value={field.value || ''}
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
                        {t(`salutationOptions.${salutation}`)}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </div>
            </Field>
          )}
        />
      </Field>

      {/* First Name */}
      <Field>
        <Controller
          name='firstName'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='firstName'
                label={t('fields.firstName')}
                autoComplete='given-name'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />
      </Field>

      {/* Last Name */}
      <Field>
        <Controller
          name='lastName'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='lastName'
                label={t('fields.lastName')}
                autoComplete='family-name'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />
      </Field>

      {/* Street Name and Number */}
      <div className='grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4'>
        <Field className='col-span-2'>
          <Controller
            name='streetName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='streetName'
                  label={t('fields.streetName')}
                  required
                  autoComplete='street-address'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />
        </Field>

        <Field className='col-span-1'>
          <Controller
            name='streetNumber'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='streetNumber'
                  label={t('fields.streetNumber')}
                  autoComplete='address-line2'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />
        </Field>
      </div>

      {/* Additional Street Info - Expandable */}
      {!showAdditionalStreetInfo ? (
        <button
          type='button'
          onClick={() => setShowAdditionalStreetInfo(true)}
          className='flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900'
        >
          <PlusIcon className='size-4' />
          {t('additionalAddressLine')}
        </button>
      ) : (
        <Field>
          <Controller
            name='additionalStreetInfo'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='additionalStreetInfo'
                  label={t('fields.additionalStreetInfo')}
                  autoComplete='address-line3'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />
        </Field>
      )}

      {/* Postal Code and City - Side by Side */}
      <div className='grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4'>
        <Field className='col-span-1'>
          <Controller
            name='postalCode'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='postalCode'
                  label={t('fields.postalCode')}
                  required
                  autoComplete='postal-code'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />
        </Field>

        <Field className='col-span-2'>
          <Controller
            name='city'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <TextInput
                  {...field}
                  id='city'
                  label={t('fields.city')}
                  required
                  autoComplete='address-level2'
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )}
          />
        </Field>
      </div>

      {/* Email Address */}
      <Field>
        <Controller
          name='email'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <TextInput
                {...field}
                id='email'
                label={t('fields.email')}
                type='email'
                autoComplete='email'
              />
              {fieldState.invalid && fieldState.error && (
                <FieldError error={fieldState.error} />
              )}
            </Field>
          )}
        />
      </Field>

      {/* Country */}
      <Field>
        <Controller
          name='country'
          control={form.control}
          render={({ field, fieldState }) => {
            // Ensure value is a string (not undefined) for Select component
            const countryValue = field.value || ''
            return (
              <Field data-invalid={fieldState.invalid}>
                <Select
                  key={countryValue} // Force re-render when country value changes
                  value={countryValue}
                  label={t('fields.country')}
                  options={storeConfig.countries.map((country) => ({
                    value: country,
                    label: getCountryLabel(country, tCommon),
                  }))}
                  required
                  invalid={fieldState.invalid}
                  onValueChange={field.onChange}
                />
                {fieldState.invalid && fieldState.error && (
                  <FieldError error={fieldState.error} />
                )}
              </Field>
            )
          }}
        />
      </Field>

      {/* Default Address Options - Only shown in customer area */}
      {showDefaultAddressOptions && (
        <div className='space-y-3 border-t border-gray-200 pt-4'>
          <Field>
            <Controller
              name='isDefaultShipping'
              control={form.control}
              render={({ field }) => (
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='isDefaultShipping'
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                  <label
                    htmlFor='isDefaultShipping'
                    className='cursor-pointer text-sm font-medium text-gray-700'
                  >
                    {t('defaultShipping')}
                  </label>
                </div>
              )}
            />
          </Field>
          <Field>
            <Controller
              name='isDefaultBilling'
              control={form.control}
              render={({ field }) => (
                <div className='flex items-center gap-3'>
                  <Checkbox
                    id='isDefaultBilling'
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                  />
                  <label
                    htmlFor='isDefaultBilling'
                    className='cursor-pointer text-sm font-medium text-gray-700'
                  >
                    {t('defaultBilling')}
                  </label>
                </div>
              )}
            />
          </Field>
        </div>
      )}
    </form>
  )
}
