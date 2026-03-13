declare module '*.svg' {
  import * as React from 'react'
  const SVG: React.FC<React.SVGProps<SVGSVGElement> & { className?: string }>
  export default SVG
}

declare module '*.svg?url' {
  const content: string
  export default content
}
