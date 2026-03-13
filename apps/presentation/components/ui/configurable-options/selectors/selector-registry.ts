import React from 'react'
import type { BaseOptionItemResponse } from '@core/contracts/product/option-item'
import type { ConfigurableOptionResponse } from '@core/contracts/product/configurable-option'
import { ColorSelector } from './color-selector'
import { ThumbnailSelector } from './thumbnail-selector'
import { ValueSelector } from './value-selector'

export type SelectorComponentProps = {
  options: BaseOptionItemResponse[]
  value?: string
  onChange?: (value: string) => void
  className?: string
  layout?: 'inline' | 'grid'
}

export type SelectorComponent = React.ComponentType<SelectorComponentProps>

export const SELECTOR_COMPONENTS: Record<
  ConfigurableOptionResponse['type'],
  SelectorComponent
> = {
  color: ColorSelector as SelectorComponent,
  image: ThumbnailSelector as SelectorComponent,
  string: ValueSelector as SelectorComponent,
}

export const getSelectorComponent = (
  type: ConfigurableOptionResponse['type']
): SelectorComponent => {
  return SELECTOR_COMPONENTS[type]
}
