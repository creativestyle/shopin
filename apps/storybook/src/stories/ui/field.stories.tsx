import type { FormEvent, ReactNode } from 'react'
import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { action } from 'storybook/actions'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field'
import { TextInput } from '@/components/ui/inputs/text-input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-button'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

function FieldStoryFrame({ children }: { children: ReactNode }) {
  return (
    <div className='mx-auto box-border w-[min(100%,450px)] min-w-[300px] shrink-0'>
      {children}
    </div>
  )
}

const meta = {
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Basic (text input)',
  render: () => (
    <FieldStoryFrame>
      <Field>
        <TextInput
          id='field-first-name'
          label='First name'
          required
        />
      </Field>
    </FieldStoryFrame>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <FieldStoryFrame>
      <Field>
        <TextInput
          id='field-email'
          label='Email'
          type='email'
          required
        />
        <FieldDescription>
          We will send your order confirmation and tracking to this address.
        </FieldDescription>
      </Field>
    </FieldStoryFrame>
  ),
}

export const WithError: Story = {
  render: () => (
    <FieldStoryFrame>
      <Field data-invalid={true}>
        <TextInput
          id='field-last-name'
          label='Last name'
          required
          defaultValue='M'
        />
        <FieldError
          error={{ message: 'account.signUp.errors.lastNameRequired' }}
        />
      </Field>
    </FieldStoryFrame>
  ),
}

export const MultipleFields: Story = {
  render: () => (
    <FieldStoryFrame>
      <div className='flex flex-col gap-4'>
        <Field>
          <TextInput
            id='field-multi-first'
            label='First name'
            required
          />
        </Field>

        <Field data-invalid={true}>
          <TextInput
            id='field-multi-last'
            label='Last name'
            required
            defaultValue='A'
          />
          <FieldError
            error={{ message: 'account.signUp.errors.lastNameRequired' }}
          />
        </Field>

        <Field>
          <TextInput
            id='field-multi-email'
            label='Email'
            type='email'
            required
          />
          <FieldDescription>
            We never sell your email address to third parties.
          </FieldDescription>
        </Field>
      </div>
    </FieldStoryFrame>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <FieldStoryFrame>
      <Field data-invalid={true}>
        <div className='flex items-start gap-3'>
          <Checkbox id='field-terms' />
          <Label
            htmlFor='field-terms'
            className='!block min-w-0 flex-1 font-normal'
          >
            I accept the terms and conditions
          </Label>
        </div>
        <FieldError
          variant='checkbox'
          error={{ message: 'checkout.steps.review.termsRequired' }}
        />
      </Field>
    </FieldStoryFrame>
  ),
}

function RadioGroupExample() {
  const [value, setValue] = useState('')

  return (
    <FieldStoryFrame>
      <Field data-invalid={true}>
        <FieldSet>
          <FieldLegend required>Title</FieldLegend>
          <RadioGroup
            orientation='horizontal'
            value={value}
            onValueChange={setValue}
          >
            <div className='flex items-center gap-3'>
              <RadioGroupItem
                id='field-salutation-ms'
                value='ms'
                invalid={true}
              />
              <Label htmlFor='field-salutation-ms'>Ms.</Label>
            </div>
            <div className='flex items-center gap-3'>
              <RadioGroupItem
                id='field-salutation-mr'
                value='mr'
                invalid={true}
              />
              <Label htmlFor='field-salutation-mr'>Mr.</Label>
            </div>
          </RadioGroup>
        </FieldSet>
        <FieldError
          variant='radio'
          error={{ message: 'address.errors.salutationRequired' }}
        />
      </Field>
    </FieldStoryFrame>
  )
}

export const WithRadioGroup: Story = {
  render: () => <RadioGroupExample />,
}

function SelectExample() {
  const [value, setValue] = useState('')

  return (
    <FieldStoryFrame>
      <Field data-invalid={true}>
        <Select
          label='Country'
          value={value}
          onValueChange={setValue}
          required
          options={[
            { value: 'gb', label: 'United Kingdom' },
            { value: 'de', label: 'Germany' },
            { value: 'fr', label: 'France' },
            { value: 'ch', label: 'Switzerland' },
          ]}
        />
        <FieldError error={{ message: 'address.errors.countryRequired' }} />
      </Field>
    </FieldStoryFrame>
  )
}

export const WithSelect: Story = {
  render: () => <SelectExample />,
}

function CheckoutFormExample() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.firstName) {
      newErrors.firstName = 'account.signUp.errors.firstNameRequired'
    }
    if (!formData.lastName) {
      newErrors.lastName = 'account.signUp.errors.lastNameRequired'
    }
    if (!formData.email) {
      newErrors.email = 'address.errors.emailRequired'
    }
    if (!formData.country) {
      newErrors.country = 'address.errors.countryRequired'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      action('submit')(formData)
    }
  }

  return (
    <FieldStoryFrame>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col gap-4'
      >
        <Field data-invalid={!!errors.firstName}>
          <TextInput
            id='field-form-first'
            label='First name'
            required
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
          />
          {errors.firstName && (
            <FieldError error={{ message: errors.firstName }} />
          )}
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <TextInput
            id='field-form-last'
            label='Last name'
            required
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
          />
          {errors.lastName && (
            <FieldError error={{ message: errors.lastName }} />
          )}
        </Field>

        <Field data-invalid={!!errors.email}>
          <TextInput
            id='field-form-email'
            label='Email'
            type='email'
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <FieldDescription>
            Used for your order confirmation and delivery updates.
          </FieldDescription>
          {errors.email && <FieldError error={{ message: errors.email }} />}
        </Field>

        <Field data-invalid={!!errors.country}>
          <Select
            label='Country'
            value={formData.country}
            onValueChange={(v) => setFormData({ ...formData, country: v })}
            required
            options={[
              { value: 'gb', label: 'United Kingdom' },
              { value: 'de', label: 'Germany' },
              { value: 'fr', label: 'France' },
              { value: 'ch', label: 'Switzerland' },
            ]}
          />
          {errors.country && <FieldError error={{ message: errors.country }} />}
        </Field>

        <Button type='submit'>Continue</Button>
      </form>
    </FieldStoryFrame>
  )
}

export const CheckoutForm: Story = {
  name: 'Form (validation)',
  render: () => <CheckoutFormExample />,
}

export const FieldsetGroup: Story = {
  name: 'Fieldset',
  render: () => (
    <FieldStoryFrame>
      <FieldSet>
        <FieldLegend>Contact details</FieldLegend>
        <div className='flex flex-col gap-4'>
          <Field>
            <TextInput
              id='field-fieldset-name'
              label='Full name'
              required
            />
          </Field>
          <Field>
            <TextInput
              id='field-fieldset-email'
              label='Email'
              type='email'
              required
            />
          </Field>
        </div>
      </FieldSet>
    </FieldStoryFrame>
  ),
}
