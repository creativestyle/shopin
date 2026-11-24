import {
  CartService,
  CustomerService,
  MockAnonymousSessionService,
  MockConfirmEmailService,
  MockForgotPasswordService,
  MockGenerateEmailTokenService,
  MockLoginService,
  MockRefreshTokenService,
  MockRegisterService,
  MockResetPasswordService,
  MockSessionService,
  OrderService,
} from '@integrations/mock-api'

const PASSWORD = 'Secret123!'

function createServices() {
  let accessToken: string | undefined
  const sessions = new MockSessionService({
    getAccessToken: async () => accessToken,
  } as never)
  const logger = { setContext: jest.fn(), warn: jest.fn(), info: jest.fn() }
  const language = { getCurrentLanguage: () => 'en-US' }

  return {
    useToken: (token?: string) => {
      accessToken = token
    },
    anonymous: new MockAnonymousSessionService(),
    register: new MockRegisterService(),
    emailToken: new MockGenerateEmailTokenService(),
    confirm: new MockConfirmEmailService(),
    login: new MockLoginService(sessions),
    refresh: new MockRefreshTokenService(),
    forgot: new MockForgotPasswordService(),
    reset: new MockResetPasswordService(),
    customer: new CustomerService(sessions),
    cart: new CartService(language as never, logger as never, sessions),
    order: new OrderService(logger as never, sessions),
  }
}

let counter = 0
const uniqueEmail = () => `mock-auth-${Date.now()}-${counter++}@example.com`

async function registerVerified(
  services: ReturnType<typeof createServices>,
  email: string
) {
  await services.register.register({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email,
    password: PASSWORD,
    acceptTerms: true,
  })
  const { emailToken } = await services.emailToken.generateEmailToken({ email })
  await services.confirm.confirmEmail({ tokenValue: emailToken ?? '' })
}

describe('mock auth services', () => {
  it('blocks sign-in until the email is confirmed', async () => {
    const services = createServices()
    const email = uniqueEmail()
    await services.register.register({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email,
      password: PASSWORD,
      acceptTerms: true,
    })

    await expect(
      services.login.login({ email, password: PASSWORD })
    ).rejects.toMatchObject({ status: 403 })

    const { emailToken } = await services.emailToken.generateEmailToken({
      email,
    })
    await expect(
      services.confirm.confirmEmail({ tokenValue: emailToken ?? '' })
    ).resolves.toEqual({ success: true })
    await expect(
      services.login.login({ email, password: PASSWORD })
    ).resolves.toMatchObject({ success: true })
  })

  it('rejects a wrong password and a taken email', async () => {
    const services = createServices()
    const email = uniqueEmail()
    await registerVerified(services, email)

    await expect(
      services.login.login({ email, password: 'wrong' })
    ).rejects.toMatchObject({ status: 401 })
    await expect(
      services.register.register({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: email.toUpperCase(),
        password: PASSWORD,
        acceptTerms: true,
      })
    ).rejects.toMatchObject({ status: 409 })
  })

  it('reports an unknown confirmation token as invalid', async () => {
    const services = createServices()

    await expect(
      services.confirm.confirmEmail({ tokenValue: 'nope' })
    ).resolves.toEqual({
      success: false,
      statusCode: 400,
      message: 'token_invalid',
    })
  })

  it('keeps the customer signed in across a token refresh', async () => {
    const services = createServices()
    const email = uniqueEmail()
    await registerVerified(services, email)
    const { refreshToken } = await services.login.login({
      email,
      password: PASSWORD,
    })

    const refreshed = await services.refresh.refreshToken({ refreshToken })
    services.useToken(refreshed.accessToken)

    await expect(services.customer.getCurrentCustomer()).resolves.toMatchObject(
      { email }
    )
    await expect(
      services.refresh.refreshToken({ refreshToken })
    ).rejects.toMatchObject({ status: 401 })
  })

  it('resets the password with a reset token', async () => {
    const services = createServices()
    const email = uniqueEmail()
    await registerVerified(services, email)

    const { passwordResetToken } = await services.forgot.forgotPassword({
      email,
    })
    await services.reset.resetPassword({
      tokenValue: passwordResetToken ?? '',
      newPassword: 'NewSecret456!',
    })

    await expect(
      services.login.login({ email, password: 'NewSecret456!' })
    ).resolves.toMatchObject({ success: true })
  })
})

describe('mock customer, cart and order ownership', () => {
  it('moves the guest cart to the customer at sign-in', async () => {
    const services = createServices()
    const email = uniqueEmail()
    await registerVerified(services, email)

    const guest = await services.anonymous.createAnonymousSession()
    services.useToken(guest.accessToken)
    const guestCart = await services.cart.createCart()
    await expect(services.cart.getActiveCart()).resolves.toBeNull()

    const signedIn = await services.login.login({ email, password: PASSWORD })
    services.useToken(signedIn.accessToken)

    await expect(services.cart.getActiveCart()).resolves.toMatchObject({
      id: guestCart.id,
    })
  })

  it('stores the billing email on the order and lists it for the customer', async () => {
    const services = createServices()
    const email = uniqueEmail()
    await registerVerified(services, email)
    const signedIn = await services.login.login({ email, password: PASSWORD })
    services.useToken(signedIn.accessToken)

    const cart = await services.cart.createCart()
    await services.cart.addToCart(cart.id, 'p-1')
    await services.cart.setBillingAddress(cart.id, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      streetName: 'Main Street',
      postalCode: '10001',
      city: 'New York',
      country: 'US',
      email,
    })
    const order = await services.order.createOrder({ cartId: cart.id })

    expect(order.email).toBe(email)
    const history = await services.order.getOrders()
    expect(history.orders.map(({ id }) => id)).toEqual([order.id])

    services.useToken(undefined)
    await expect(services.order.getOrders()).resolves.toMatchObject({
      total: 0,
    })
  })

  it('checks the password and uniqueness when changing the email', async () => {
    const services = createServices()
    const email = uniqueEmail()
    const otherEmail = uniqueEmail()
    await registerVerified(services, email)
    await registerVerified(services, otherEmail)
    const signedIn = await services.login.login({ email, password: PASSWORD })
    services.useToken(signedIn.accessToken)

    await expect(
      services.customer.changeCustomerEmail({
        email: uniqueEmail(),
        currentPassword: 'wrong',
      })
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      services.customer.changeCustomerEmail({
        email,
        currentPassword: PASSWORD,
      })
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      services.customer.changeCustomerEmail({
        email: otherEmail,
        currentPassword: PASSWORD,
      })
    ).rejects.toMatchObject({ status: 409 })

    const newEmail = uniqueEmail()
    await expect(
      services.customer.changeCustomerEmail({
        email: newEmail,
        currentPassword: PASSWORD,
      })
    ).resolves.toMatchObject({ email: newEmail, isEmailVerified: false })
  })

  it('rejects customer calls from a guest session', async () => {
    const services = createServices()
    const guest = await services.anonymous.createAnonymousSession()
    services.useToken(guest.accessToken)

    await expect(services.customer.getCurrentCustomer()).rejects.toMatchObject({
      status: 401,
    })
  })
})
