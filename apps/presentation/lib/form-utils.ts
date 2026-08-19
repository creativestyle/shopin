import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

/**
 * Re-runs validation of a field that depends on another one (e.g. "confirm password"),
 * so a cross-field error clears while the user edits the field it compares against.
 * No-op while the dependent field is still empty.
 */
export function revalidateDependentField<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  dependentField: FieldPath<TFieldValues>
): void {
  if (form.getValues(dependentField)) {
    void form.trigger(dependentField)
  }
}
