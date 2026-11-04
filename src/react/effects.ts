import { Particles, type ParticlesOptions } from '../core/effects/particles'
import { Ripple, type RippleOptions } from '../core/effects/ripple'
import { Trail, type TrailOptions } from '../core/effects/trail'
import { useCursorEffect } from './hooks'

const createTrail = (options: TrailOptions): Trail => new Trail(options)
const createParticles = (options: ParticlesOptions): Particles => new Particles(options)
const createRipple = (options: RippleOptions): Ripple => new Ripple(options)

export function CursorTrail(props: TrailOptions): null {
  useCursorEffect(createTrail, props)
  return null
}

export function CursorParticles(props: ParticlesOptions): null {
  useCursorEffect(createParticles, props)
  return null
}

export function CursorRipple(props: RippleOptions): null {
  useCursorEffect(createRipple, props)
  return null
}
