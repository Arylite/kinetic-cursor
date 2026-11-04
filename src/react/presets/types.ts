import type { CSSProperties } from 'react'
import type { ParticlesOptions } from '../../core/effects/particles'
import type { RippleOptions } from '../../core/effects/ripple'
import type { TrailOptions } from '../../core/effects/trail'
import type { CursorLayerProps } from '../CursorLayer'

export interface LayerConfig extends Omit<CursorLayerProps, 'name' | 'children'> {
  /** Renders the hovered target's label inside this layer. */
  label?: boolean
}

export interface CursorPreset {
  color?: string
  blendMode?: CSSProperties['mixBlendMode']
  /** Named layers, stacked in order: later layers render on top. `false` removes one. */
  layers?: Readonly<Record<string, LayerConfig | false>>
  trail?: TrailOptions | false
  particles?: ParticlesOptions | false
  ripple?: RippleOptions | false
}
