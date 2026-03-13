import { FC, ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { type OrderState } from '@core/contracts/order/order'
import CheckmarkIcon from '@/public/icons/checkmark.svg'
import CloseIcon from '@/public/icons/close.svg'
import {
  type Step,
  type StepVariant,
  STATE_TO_STEP_INDEX,
  buildSteps,
} from '../lib/order-status-progress-utils'

interface ConnectorEnd {
  solid: string
  gradient: string
}

interface VariantConfig {
  circle: string
  label: string
  icon: ReactNode
  isActive: boolean
  connectorSource: ConnectorEnd
  connectorTarget: ConnectorEnd
}

const VARIANT_CONFIG: Record<StepVariant, VariantConfig> = {
  completed: {
    circle: 'border-green-600 bg-green-600 text-white',
    label: 'font-medium text-gray-900',
    icon: <CheckmarkIcon className='h-4 w-4' />,
    isActive: false,
    connectorSource: { solid: 'bg-green-600', gradient: 'from-green-600' },
    connectorTarget: { solid: 'bg-green-600', gradient: 'to-green-600' },
  },
  current: {
    circle: 'border-green-600 bg-green-600 text-white',
    label: 'font-medium text-gray-900',
    icon: <CheckmarkIcon className='h-4 w-4' />,
    isActive: true,
    connectorSource: { solid: 'bg-gray-300', gradient: 'from-gray-300' },
    connectorTarget: { solid: 'bg-green-600', gradient: 'to-green-600' },
  },
  processing: {
    circle: 'border-orange-400 bg-orange-400 text-white',
    label: 'font-medium text-gray-900',
    icon: <CheckmarkIcon className='h-4 w-4' />,
    isActive: true,
    connectorSource: { solid: 'bg-gray-300', gradient: 'from-gray-300' },
    connectorTarget: { solid: 'bg-orange-400', gradient: 'to-orange-400' },
  },
  upcoming: {
    circle: 'border-gray-300 bg-white text-gray-400',
    label: 'text-gray-400',
    icon: null,
    isActive: false,
    connectorSource: { solid: 'bg-gray-300', gradient: 'from-gray-300' },
    connectorTarget: { solid: 'bg-gray-300', gradient: 'to-gray-300' },
  },
  cancelled: {
    circle: 'border-red-400 bg-red-400 text-white',
    label: 'font-medium text-red-500',
    icon: <CloseIcon className='h-4 w-4' />,
    isActive: false,
    connectorSource: { solid: 'bg-red-400', gradient: 'from-red-400' },
    connectorTarget: { solid: 'bg-red-400', gradient: 'to-red-400' },
  },
}

const getConnectorClass = (
  currentVariant: StepVariant,
  nextVariant: StepVariant
): string => {
  const source = VARIANT_CONFIG[currentVariant].connectorSource
  const target = VARIANT_CONFIG[nextVariant].connectorTarget

  if (source.solid === target.solid) {
    return source.solid
  }

  return `bg-gradient-to-r ${source.gradient} ${target.gradient}`
}

interface StepItemProps {
  step: Step
  nextVariant?: StepVariant
  isLast: boolean
  isCancelled: boolean
  label: string
}

const StepItem: FC<StepItemProps> = ({
  step,
  nextVariant,
  isLast,
  isCancelled,
  label,
}) => {
  const config = VARIANT_CONFIG[step.variant]

  return (
    <li
      aria-current={config.isActive ? 'step' : undefined}
      className={cn(
        'flex items-center',
        isLast && !isCancelled ? 'shrink-0' : 'flex-1'
      )}
    >
      <div className='flex flex-col items-center gap-1'>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
            config.circle
          )}
        >
          {config.icon}
        </div>
        <span className={cn('text-xs', config.label)}>{label}</span>
      </div>
      {nextVariant && (
        <div
          aria-hidden='true'
          className={cn(
            'mb-4 h-0.5 flex-1',
            getConnectorClass(step.variant, nextVariant)
          )}
        />
      )}
    </li>
  )
}

interface OrderStatusProgressProps {
  orderState: OrderState
}

export const OrderStatusProgress: FC<OrderStatusProgressProps> = ({
  orderState,
}) => {
  const t = useTranslations('orderHistory')
  const stepIndex = STATE_TO_STEP_INDEX[orderState] ?? 0
  const isCancelled = stepIndex === -1
  const steps = buildSteps(stepIndex, isCancelled)
  const progressValue = isCancelled
    ? steps.length - 1
    : Math.min(stepIndex, steps.length - 1)

  return (
    <div
      role='progressbar'
      aria-valuenow={progressValue}
      aria-valuemin={0}
      aria-valuemax={steps.length - 1}
      aria-label={t('orderStatusAria', {
        state: t(`orderState.${orderState}`),
      })}
    >
      <ol className='m-0 flex list-none items-start p-0'>
        {steps.map((step, index) => (
          <StepItem
            key={step.stateKey}
            step={step}
            nextVariant={steps[index + 1]?.variant}
            isLast={index === steps.length - 1}
            isCancelled={isCancelled}
            label={t(`orderState.${step.stateKey}`)}
          />
        ))}
      </ol>
    </div>
  )
}
