import { type OrderState, OrderStateSchema } from '@core/contracts/order/order'

export type StepVariant =
  | 'completed'
  | 'current'
  | 'processing'
  | 'upcoming'
  | 'cancelled'

export interface Step {
  stateKey: OrderState
  variant: StepVariant
}

const DEFAULT_STEPS = [
  OrderStateSchema.enum.Open,
  OrderStateSchema.enum.Processing,
  OrderStateSchema.enum.Shipped,
] as const

export const STATE_TO_STEP_INDEX: Record<OrderState, number> = {
  [OrderStateSchema.enum.Open]: 0,
  [OrderStateSchema.enum.Confirmed]: 1,
  [OrderStateSchema.enum.Processing]: 1,
  [OrderStateSchema.enum.Shipped]: 2,
  [OrderStateSchema.enum.Complete]: DEFAULT_STEPS.length,
  [OrderStateSchema.enum.Delivered]: DEFAULT_STEPS.length,
  [OrderStateSchema.enum.Cancelled]: -1,
}

export function buildSteps(stepIndex: number, isCancelled: boolean): Step[] {
  if (isCancelled) {
    return [
      { stateKey: OrderStateSchema.enum.Open, variant: 'completed' },
      { stateKey: OrderStateSchema.enum.Cancelled, variant: 'cancelled' },
    ]
  }

  return DEFAULT_STEPS.map((stateKey, index) => {
    if (index < stepIndex) {
      return { stateKey, variant: 'completed' as const }
    }

    if (index === stepIndex) {
      const variant =
        stateKey === OrderStateSchema.enum.Processing
          ? ('processing' as const)
          : ('current' as const)
      return { stateKey, variant }
    }

    return { stateKey, variant: 'upcoming' as const }
  })
}
