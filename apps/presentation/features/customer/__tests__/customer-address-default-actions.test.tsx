import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomerAddressDefaultActions } from '../customer-address-default-actions'

const mockOperations = {
  handleSetDefaultShipping: jest.fn(),
  handleSetDefaultBilling: jest.fn(),
  isSetDefaultShippingPending: false,
  isSetDefaultBillingPending: false,
}

jest.mock('../customer-use-customer-address-operations', () => ({
  useCustomerAddressOperations: () => mockOperations,
}))

const NS = 'account.myAccount.addresses'

describe('CustomerAddressDefaultActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOperations.isSetDefaultShippingPending = false
    mockOperations.isSetDefaultBillingPending = false
  })

  it('offers both actions for a non-default address and calls them with the address id', async () => {
    const user = userEvent.setup()
    render(
      <CustomerAddressDefaultActions
        addressId='addr-1'
        isDefaultShipping={false}
        isDefaultBilling={false}
      />
    )

    await user.click(
      screen.getByRole('button', { name: `${NS}.setDefaultShipping` })
    )
    await user.click(
      screen.getByRole('button', { name: `${NS}.setDefaultBilling` })
    )

    expect(mockOperations.handleSetDefaultShipping).toHaveBeenCalledWith(
      'addr-1'
    )
    expect(mockOperations.handleSetDefaultBilling).toHaveBeenCalledWith(
      'addr-1'
    )
  })

  it('shows the default state without a set action', async () => {
    const user = userEvent.setup()
    render(
      <CustomerAddressDefaultActions
        addressId='addr-1'
        isDefaultShipping
        isDefaultBilling
      />
    )

    expect(
      screen.queryByRole('button', { name: `${NS}.setDefaultShipping` })
    ).not.toBeInTheDocument()
    const defaultShipping = screen.getByRole('button', {
      name: `${NS}.defaultShipping`,
    })
    expect(defaultShipping).toHaveAttribute('aria-disabled', 'true')

    await user.click(defaultShipping)
    expect(mockOperations.handleSetDefaultShipping).not.toHaveBeenCalled()
  })

  it('blocks the action while it is pending', async () => {
    mockOperations.isSetDefaultShippingPending = true
    const user = userEvent.setup()
    render(
      <CustomerAddressDefaultActions
        addressId='addr-1'
        isDefaultShipping={false}
        isDefaultBilling={false}
      />
    )

    const setShipping = screen.getByRole('button', {
      name: `${NS}.setDefaultShipping`,
    })
    expect(setShipping).toHaveAttribute('aria-disabled', 'true')

    setShipping.click()
    await user.keyboard('{Enter}')
    expect(mockOperations.handleSetDefaultShipping).not.toHaveBeenCalled()
  })

  it('keeps focus on the control once the address becomes the default', () => {
    const { rerender } = render(
      <CustomerAddressDefaultActions
        addressId='addr-1'
        isDefaultShipping={false}
        isDefaultBilling={false}
      />
    )
    screen.getByRole('button', { name: `${NS}.setDefaultShipping` }).focus()

    rerender(
      <CustomerAddressDefaultActions
        addressId='addr-1'
        isDefaultShipping
        isDefaultBilling={false}
      />
    )

    expect(
      screen.getByRole('button', { name: `${NS}.defaultShipping` })
    ).toHaveFocus()
  })
})
