import * as React from 'react'
import { Primitive } from '@radix-ui/react-primitive'

const VISUALLY_HIDDEN_STYLES = Object.freeze({
  position: 'absolute',
  border: 0,
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  wordWrap: 'normal',
}) satisfies React.CSSProperties

const NAME = 'VisuallyHidden'

type VisuallyHiddenElement = React.ComponentRef<typeof Primitive.div>
type VisuallyHiddenProps = React.ComponentPropsWithoutRef<typeof Primitive.div>

const VisuallyHidden = React.forwardRef<
  VisuallyHiddenElement,
  VisuallyHiddenProps
>((props, forwardedRef) => {
  return (
    <Primitive.div
      {...props}
      ref={forwardedRef}
      style={{ ...VISUALLY_HIDDEN_STYLES, ...props.style }}
    />
  )
})

VisuallyHidden.displayName = NAME

const Root = VisuallyHidden

export { VisuallyHidden, Root, VISUALLY_HIDDEN_STYLES }
export type { VisuallyHiddenProps }
