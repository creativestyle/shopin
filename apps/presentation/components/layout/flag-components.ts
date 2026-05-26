import type React from 'react'
import FlagDE from '../../public/icons/flag-de.svg'
import FlagUS from '../../public/icons/flag-us.svg'

export const FLAG_COMPONENTS: Record<
  string,
  React.ComponentType<{ 'className'?: string; 'aria-hidden'?: boolean }>
> = {
  en: FlagUS,
  de: FlagDE,
}
