import { z } from 'zod'

/**
 * Payment method response schema
 * Shape follows the common commerce PaymentMethod structure
 */
export const PaymentMethodResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  localizedDescription: z.record(z.string(), z.string()).optional(),
  method: z.string().optional(), // e.g., 'credit-card', 'wallet', 'invoice', etc.
  /** The payment integration that handles this method (the cart's `paymentInfo.provider`). */
  provider: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export type PaymentMethodResponse = z.infer<typeof PaymentMethodResponseSchema>

/**
 * Payment methods response schema
 */
export const PaymentMethodsResponseSchema = z.object({
  paymentMethods: z.array(PaymentMethodResponseSchema),
})

export type PaymentMethodsResponse = z.infer<
  typeof PaymentMethodsResponseSchema
>

/**
 * Set payment method request schema
 */
export const SetPaymentMethodRequestSchema = z.object({
  paymentMethodId: z.string(),
  /** The payment integration that handles the method, as the method list names it. */
  provider: z.string().min(1),
  paymentMethodName: z.string().min(1),
  localizedDescription: z.record(z.string(), z.string()).optional(),
})

export type SetPaymentMethodRequest = z.infer<
  typeof SetPaymentMethodRequestSchema
>

/**
 * Initiate payment request schema
 */
export const InitiatePaymentRequestSchema = z.object({
  cartId: z.string(),
})

export type InitiatePaymentRequest = z.infer<
  typeof InitiatePaymentRequestSchema
>

/**
 * The payment provider sends the shopper back to the shop's one return route with its own query parameters (a
 * payment id, a result token): the storefront hands them to the BFF as they came.
 */
export const PaymentReturnRequestSchema = z.object({
  paymentId: z.string().min(1),
  params: z.record(z.string(), z.string()).default({}),
})

export type PaymentReturnRequest = z.infer<typeof PaymentReturnRequestSchema>

/** What the payment integration says about a payment: an order is created only for `paid` or `authorized`. */
export const PaymentStatusSchema = z.enum([
  'paid',
  'authorized',
  'pending',
  'failed',
  'cancelled',
])

export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

/**
 * The provider's answer: the status, the cart the payment was started for (`getPaymentLink(cartId, total)`), and the
 * amount and currency the provider confirmed. The BFF orders only that cart, and only when the confirmed amount and
 * currency equal the cart's total at the return: a payment id of someone else's paid payment never orders this
 * shopper's cart, and a cart changed while the provider's page was open is never ordered against the old payment.
 * A `paid` or `authorized` result without an amount orders nothing.
 */
export const PaymentResultSchema = z.object({
  status: PaymentStatusSchema,
  cartId: z.string(),
  /** The confirmed amount in the currency's minor units (cents), as the cart's totals are. */
  amount: z.number().int().nonnegative().optional(),
  /** The confirmed amount's currency (ISO 4217). */
  currency: z.string().optional(),
})

export type PaymentResult = z.infer<typeof PaymentResultSchema>

/** What the payment is started for: the cart's total, in minor units, and its currency. */
export interface PaymentAmount {
  amount: number
  currency: string
}

/** The return route's answer: the order when the payment went through, else the payment's status. */
export const PaymentReturnResponseSchema = z.object({
  status: PaymentStatusSchema,
  orderId: z.string().optional(),
})

export type PaymentReturnResponse = z.infer<typeof PaymentReturnResponseSchema>
