import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
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

const meta: Meta<typeof Field> = {
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicWithTextInput: Story = {
  render: () => (
    <div className='w-[400px]'>
      <Field>
        <TextInput
          id='firstName'
          label='Vorname'
          required
        />
      </Field>
    </div>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <div className='w-[400px]'>
      <Field>
        <TextInput
          id='email'
          label='E-Mail-Adresse'
          type='email'
          required
        />
        <FieldDescription>
          Wir senden Ihnen eine Bestätigung per E-Mail.
        </FieldDescription>
      </Field>
    </div>
  ),
}

export const WithError: Story = {
  render: () => (
    <div className='w-[400px]'>
      <Field data-invalid={true}>
        <TextInput
          id='lastName'
          label='Nachname'
          required
          defaultValue='M'
        />
        <FieldError
          error={{ message: 'Nachname muss mindestens 2 Zeichen lang sein' }}
        />
      </Field>
    </div>
  ),
}

export const MultipleFields: Story = {
  render: () => (
    <div className='flex w-[400px] flex-col gap-4'>
      <Field>
        <TextInput
          id='firstName-multi'
          label='Vorname'
          required
        />
      </Field>

      <Field data-invalid={true}>
        <TextInput
          id='lastName-multi'
          label='Nachname'
          required
          defaultValue='A'
        />
        <FieldError error={{ message: 'Nachname ist zu kurz' }} />
      </Field>

      <Field>
        <TextInput
          id='email-multi'
          label='E-Mail'
          type='email'
          required
        />
        <FieldDescription>
          Wir werden Ihre E-Mail-Adresse niemals weitergeben
        </FieldDescription>
      </Field>
    </div>
  ),
}

export const WithCheckbox: Story = {
  render: () => (
    <div className='w-[500px]'>
      <Field data-invalid={true}>
        <div className='flex items-start gap-3'>
          <Checkbox id='terms' />
          <Label
            htmlFor='terms'
            className='text-base font-normal'
            required
          >
            Ich akzeptiere die Allgemeinen Geschäftsbedingungen
          </Label>
        </div>
        <FieldError
          variant='checkbox'
          error={{ message: 'Sie müssen die AGB akzeptieren' }}
        />
      </Field>
    </div>
  ),
}

const RadioGroupExample = () => {
  const [value, setValue] = useState('')

  return (
    <div className='w-[500px]'>
      <Field data-invalid={true}>
        <FieldSet>
          <FieldLegend required>Anrede</FieldLegend>
          <RadioGroup
            orientation='horizontal'
            value={value}
            onValueChange={setValue}
          >
            <div className='flex items-center gap-3'>
              <RadioGroupItem
                id='female'
                value='female'
                invalid={true}
              />
              <Label htmlFor='female'>Frau</Label>
            </div>
            <div className='flex items-center gap-3'>
              <RadioGroupItem
                id='male'
                value='male'
                invalid={true}
              />
              <Label htmlFor='male'>Herr</Label>
            </div>
          </RadioGroup>
        </FieldSet>
        <FieldError
          variant='radio'
          error={{ message: 'Bitte wählen Sie eine Anrede aus' }}
        />
      </Field>
    </div>
  )
}

export const WithRadioGroup: Story = {
  render: () => <RadioGroupExample />,
}

const SelectExample = () => {
  const [value, setValue] = useState('')

  return (
    <div className='w-[400px]'>
      <Field data-invalid={true}>
        <Select
          label='Land'
          value={value}
          onValueChange={setValue}
          required
          options={[
            { value: 'ch', label: 'Schweiz' },
            { value: 'de', label: 'Deutschland' },
            { value: 'fr', label: 'Frankreich' },
            { value: 'at', label: 'Österreich' },
          ]}
        />
        <FieldError error={{ message: 'Bitte wählen Sie ein Land aus' }} />
      </Field>
    </div>
  )
}

export const WithSelect: Story = {
  render: () => <SelectExample />,
}

const FormExampleComponent = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.firstName) {
      newErrors.firstName = 'Vorname ist erforderlich'
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Nachname ist erforderlich'
    }
    if (!formData.email) {
      newErrors.email = 'E-Mail ist erforderlich'
    }
    if (!formData.country) {
      newErrors.country = 'Land ist erforderlich'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted successfully!')
    }
  }

  return (
    <div className='w-[400px]'>
      <form
        onSubmit={handleSubmit}
        className='flex flex-col gap-4'
      >
        <Field data-invalid={!!errors.firstName}>
          <TextInput
            id='firstName-form'
            label='Vorname'
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
            id='lastName-form'
            label='Nachname'
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
            id='email-form'
            label='E-Mail'
            type='email'
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
          <FieldDescription>
            Wir senden Ihnen eine Bestätigung per E-Mail
          </FieldDescription>
          {errors.email && <FieldError error={{ message: errors.email }} />}
        </Field>

        <Field data-invalid={!!errors.country}>
          <Select
            label='Land'
            value={formData.country}
            onValueChange={(value) =>
              setFormData({ ...formData, country: value })
            }
            required
            options={[
              { value: 'ch', label: 'Schweiz' },
              { value: 'de', label: 'Deutschland' },
              { value: 'fr', label: 'Frankreich' },
              { value: 'at', label: 'Österreich' },
            ]}
          />
          {errors.country && <FieldError error={{ message: errors.country }} />}
        </Field>

        <Button type='submit'>Absenden</Button>
      </form>
    </div>
  )
}

export const FormExample: Story = {
  render: () => <FormExampleComponent />,
}

export const FieldSetExample: Story = {
  render: () => (
    <div className='w-[500px]'>
      <FieldSet>
        <FieldLegend>Persönliche Informationen</FieldLegend>
        <div className='flex flex-col gap-4'>
          <Field>
            <TextInput
              id='name-fieldset'
              label='Name'
              required
            />
          </Field>
          <Field>
            <TextInput
              id='email-fieldset'
              label='E-Mail'
              type='email'
              required
            />
          </Field>
        </div>
      </FieldSet>
    </div>
  ),
}
