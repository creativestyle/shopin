import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { AddressRequest } from '@core/contracts/address/address-base'
import { AddressForm } from '../address-form'

// Mock ResizeObserver for Radix UI
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

jest.mock('@/features/store-config/store-config-provider', () => ({
  useStoreConfig: () => ({ storeConfig: { projectCountries: ['DE', 'US'] } }),
}))

const NS = 'address.form'

const validValues: Partial<AddressRequest> = {
  salutation: '',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  streetName: 'Hauptstraße',
  streetNumber: '5',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
}

function renderForm(
  props: Partial<React.ComponentProps<typeof AddressForm>> = {}
) {
  const onSubmit = jest.fn()
  render(
    <>
      <AddressForm
        formId='address-form'
        defaultValues={validValues}
        onSubmit={onSubmit}
        {...props}
      />
      <button
        type='submit'
        form='address-form'
      >
        submit
      </button>
    </>
  )
  return { onSubmit, user: userEvent.setup() }
}

describe('AddressForm', () => {
  it('rejects an empty street number', async () => {
    const { onSubmit, user } = renderForm({
      defaultValues: { ...validValues, streetNumber: '' },
    })

    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() =>
      expect(document.getElementById('streetNumber')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('labels the salutation radio group', () => {
    renderForm()

    expect(
      screen.getByRole('radiogroup', { name: `${NS}.fields.salutation` })
    ).toBeInTheDocument()
  })

  it('has no default address checkboxes unless asked for', () => {
    renderForm()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('submits the chosen defaults when creating an address', async () => {
    const { onSubmit, user } = renderForm({ showDefaultAddressOptions: true })

    await user.click(
      screen.getByRole('checkbox', { name: `${NS}.defaultShipping` })
    )
    await user.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      isDefaultShipping: true,
    })
    expect(onSubmit.mock.calls[0][0].isDefaultBilling).toBeFalsy()
  })
})
