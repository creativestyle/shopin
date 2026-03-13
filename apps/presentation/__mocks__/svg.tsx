import React from 'react'

const SvgrMock = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      {...props}
    />
  )
)

SvgrMock.displayName = 'SvgrMock'

export const ReactComponent = SvgrMock
export default SvgrMock
