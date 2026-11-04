import type { CSSProperties, ReactNode } from 'react'
import type { LayerOptions } from '../core/layer'
import { useCursorLayer } from './hooks'

export interface CursorLayerProps extends LayerOptions {
  className?: string
  /** Visual styles. Geometry and opacity are driven by the layer options. */
  style?: CSSProperties
  children?: ReactNode
}

const baseStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  boxSizing: 'border-box',
  opacity: 0,
  willChange: 'transform',
}

export function CursorLayer({
  className,
  style,
  children,
  ...options
}: CursorLayerProps): ReactNode {
  const ref = useCursorLayer<HTMLDivElement>(options)
  return (
    <div ref={ref} className={className} style={{ ...baseStyle, ...style }}>
      {children}
    </div>
  )
}
