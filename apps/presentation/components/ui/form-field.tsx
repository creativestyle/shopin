import { ComponentProps } from 'react'
import {
  Controller,
  Control,
  FieldPath,
  FieldValues,
  ControllerRenderProps,
  ControllerFieldState,
} from 'react-hook-form'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

type FormFieldRenderProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  field: ControllerRenderProps<TFieldValues, TName>
  fieldState: ControllerFieldState
  validationState: 'error' | 'valid' | 'none'
}

type FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = {
  name: TName
  control: Control<TFieldValues>
  render: (props: FormFieldRenderProps<TFieldValues, TName>) => React.ReactNode
  errorVariant?: ComponentProps<typeof FieldError>['variant']
  /** Hint rendered under the input and linked to it via aria-describedby. */
  description?: React.ReactNode
} & Omit<ComponentProps<typeof Field>, 'children'>

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  render,
  errorVariant = 'default',
  description,
  ...fieldProps
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const validationState: 'error' | 'valid' | 'none' = fieldState.invalid
          ? 'error'
          : fieldState.isTouched && fieldState.isDirty
            ? 'valid'
            : 'none'
        return (
          <Field
            data-invalid={fieldState.invalid}
            {...fieldProps}
          >
            {render({ field, fieldState, validationState })}
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && fieldState.error && (
              <FieldError
                error={fieldState.error}
                variant={errorVariant}
              />
            )}
          </Field>
        )
      }}
    />
  )
}
