import type { CSSProperties, ReactNode } from 'react'
import { useCursorState } from './hooks'

export interface CursorLabelProps {
  className?: string
  style?: CSSProperties
}

const baseStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

/** Renders the hovered target's label, or nothing. */
export function CursorLabel({ className, style }: CursorLabelProps): ReactNode {
  const { target } = useCursorState()
  if (!target?.label) return null
  return (
    <span className={className} style={{ ...baseStyle, ...style }}>
      {target.label}
    </span>
  )
}
