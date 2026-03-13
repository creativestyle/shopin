import React from 'react'

interface IconData {
  name: string
  Component: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconContext = (require as any).context('@/public/icons', false, /\.svg$/)

export function loadIcons(): IconData[] {
  return iconContext.keys().map((key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentModule: any = iconContext(key)
    const name = key.replace('./', '').replace('.svg', '')
    const Component = componentModule.default || componentModule

    return {
      name:
        name.charAt(0).toUpperCase() +
        name.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),
      Component,
    }
  })
}
