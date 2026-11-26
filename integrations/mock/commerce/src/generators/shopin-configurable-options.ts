import type { ConfigurableOptionResponse } from '@core/contracts/product/configurable-option'
import type {
  ColorOptionItemResponse,
  ValueOptionItemResponse,
  ImageOptionItemResponse,
} from '@core/contracts/product/option-item'

export function createShopinConfigurableOptions(
  colorOptions: ColorOptionItemResponse[],
  sizeOptions: ValueOptionItemResponse[],
  styleOptions: ImageOptionItemResponse[]
): ConfigurableOptionResponse[] {
  return [
    {
      key: 'color',
      label: 'Color',
      type: 'color',
      options: colorOptions,
    },
    {
      key: 'size',
      label: 'Size',
      type: 'string',
      options: sizeOptions,
    },
    {
      key: 'style',
      label: 'Style',
      type: 'image',
      options: styleOptions,
    },
  ]
}
