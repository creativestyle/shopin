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
