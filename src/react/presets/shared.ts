import type { CSSProperties } from 'react'
import type { ShapeContext, ShapeOverride, ShapeRule } from '../../core/layer'
import { spring } from '../../core/motion'
import { caret, morph } from '../../core/shapes'
import type { LayerConfig } from './types'

export const precise = spring({ stiffness: 2200, damping: 94, matchVelocity: 0.85 })
export const trailing = spring({ stiffness: 320, damping: 30, matchVelocity: 0.55 })

export const filled: CSSProperties = { background: 'currentColor' }
export const outlined: CSSProperties = {
  border: '1.5px solid currentColor',
  display: 'grid',
  placeItems: 'center',
}

export const dot: LayerConfig = {
  motion: precise,
  size: 6,
  stretch: 0.3,
  pressScale: 0.5,
  style: filled,
  states: { button: { opacity: 0 }, label: { opacity: 0 }, text: caret() },
}

export const ring: LayerConfig = {
  label: true,
  motion: trailing,
  size: 36,
  stretch: 0.2,
  pressScale: 0.85,
  style: outlined,
  states: {
    link: { size: 56 },
    button: morph(),
    text: { size: 8, opacity: 0 },
    label: { size: 84, stretch: 0 },
  },
}

export const extend =
  (rule: (context: ShapeContext) => ShapeOverride, extra: ShapeOverride): ShapeRule =>
  (context) => ({ ...rule(context), ...extra })
