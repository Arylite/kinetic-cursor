import type { CSSProperties } from 'react'
import type { ParticlesOptions } from '../core/effects/particles'
import type { RippleOptions } from '../core/effects/ripple'
import type { TrailOptions } from '../core/effects/trail'
import { adaptive, spring } from '../core/motion'
import { caret, morph } from '../core/shapes'
import type { CursorLayerProps } from './CursorLayer'

export type LayerConfig = Omit<CursorLayerProps, 'children'>

export interface CursorPreset {
  color?: string
  blendMode?: CSSProperties['mixBlendMode']
  /** The precise layer that sits on the pointer. Effects follow its motion by default. */
  dot?: LayerConfig | false
  /** The softer layer that follows behind and reacts to targets. Renders target labels. */
  ring?: LayerConfig | false
  trail?: TrailOptions | false
  particles?: ParticlesOptions | false
  ripple?: RippleOptions | false
}

const precise = spring({ stiffness: 2200, damping: 94, matchVelocity: 0.85 })
const trailing = spring({ stiffness: 320, damping: 30, matchVelocity: 0.55 })

const filled: CSSProperties = { background: 'currentColor' }
const outlined: CSSProperties = {
  border: '1.5px solid currentColor',
  display: 'grid',
  placeItems: 'center',
}

const dot: LayerConfig = {
  motion: precise,
  size: 6,
  stretch: 0.3,
  pressScale: 0.5,
  style: filled,
  states: { button: { opacity: 0 }, label: { opacity: 0 }, text: caret() },
}

const ring: LayerConfig = {
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

/** A crisp dot with a ring that trails softly and wraps around controls. */
export const glide: CursorPreset = { color: '#fff', blendMode: 'difference', dot, ring }

/** A single dot whose smoothing relaxes as it slows down. */
export const minimal: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  dot: {
    motion: adaptive({ halfLife: 0.06, responsiveness: 0.008 }),
    size: 12,
    stretch: 0.35,
    pressScale: 0.7,
    style: filled,
    states: { link: { size: 40 }, button: { size: 40 }, label: { size: 40 }, text: caret() },
  },
}

/** A dot drawing a tapered ribbon along its path. */
export const ribbon: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  dot: { ...dot, size: 8, stretch: 0, states: { button: { size: 28 }, text: caret() } },
  trail: { width: 7, lifetime: 0.28, maxLength: 220 },
}

/** A warm dot that sheds drifting particles and ripples on press. */
export const sparkle: CursorPreset = {
  color: '#ff5c39',
  dot: { ...dot, size: 8, states: { link: { size: 20 }, button: { size: 20 }, text: caret() } },
  particles: { color: ['#ff5c39', '#ffb03a', '#ffd36e'], size: 5, spread: 40 },
  ripple: { radius: 30, opacity: 0.7 },
}

/** A large inverting disc that swells over interactive elements. */
export const lens: CursorPreset = {
  color: '#000',
  blendMode: 'difference',
  ring: {
    motion: spring({ stiffness: 520, damping: 40, matchVelocity: 0.7 }),
    size: 28,
    stretch: 0.25,
    pressScale: 0.8,
    style: { ...outlined, border: 'none', background: '#fff' },
    states: {
      link: { size: 72 },
      button: { size: 72 },
      label: { size: 96, stretch: 0 },
      text: caret({ width: 3 }),
    },
  },
}

export const presets: Readonly<
  Record<'glide' | 'minimal' | 'ribbon' | 'sparkle' | 'lens', CursorPreset>
> = {
  glide,
  minimal,
  ribbon,
  sparkle,
  lens,
}
