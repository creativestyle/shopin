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
  paymentInterface: z.string().optional(), // the PSP integration that handles this payment
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
  paymentInterface: z.string().min(1),
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
 * The provider's answer: the status, and the cart the payment was started for (`getPaymentLink(cartId)`), so the BFF
 * orders only that cart: a payment id of someone else's paid payment never orders this shopper's cart.
 */
export const PaymentResultSchema = z.object({
  status: PaymentStatusSchema,
  cartId: z.string(),
})

export type PaymentResult = z.infer<typeof PaymentResultSchema>

/** The return route's answer: the order when the payment went through, else the payment's status. */
export const PaymentReturnResponseSchema = z.object({
  status: PaymentStatusSchema,
  orderId: z.string().optional(),
})

export type PaymentReturnResponse = z.infer<typeof PaymentReturnResponseSchema>
