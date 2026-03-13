import { z } from 'zod'
import { MyCustomerApiResponseSchema } from './customer'
import { SALUTATION_OPTIONS } from '@config/constants'

export const MyCustomerAddressApiResponseSchema = z.object({
  id: z.string(),
  salutation: z.enum([...SALUTATION_OPTIONS, '']).optional(),
  country: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  streetName: z.string().optional(),
  streetNumber: z.string().optional(),
  additionalStreetInfo: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  state: z.string().optional(),
  company: z.string().optional(),
  department: z.string().optional(),
  building: z.string().optional(),
  apartment: z.string().optional(),
  pOBox: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.email().optional(),
  additionalAddressInfo: z.string().optional(),
})

export type MyCustomerAddressApiResponse = z.infer<
  typeof MyCustomerAddressApiResponseSchema
>

export const MyCustomerWithAddressesResponseSchema =
  MyCustomerApiResponseSchema.extend({
    addresses: z.array(MyCustomerAddressApiResponseSchema).optional(),
    defaultShippingAddressId: z.string().optional(),
    defaultBillingAddressId: z.string().optional(),
    shippingAddressIds: z.array(z.string()).optional(),
    billingAddressIds: z.array(z.string()).optional(),
  })

export type MyCustomerWithAddressesResponse = z.infer<
  typeof MyCustomerWithAddressesResponseSchema
>
