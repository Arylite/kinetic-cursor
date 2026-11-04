export { CursorEngine, type CursorState, type EngineOptions, type LayerHandle } from './engine'
export type { LayerOptions, Shape, ShapeContext, ShapeOverride, ShapeRule } from './layer'
export {
  adaptive,
  instant,
  smooth,
  spring,
  type AdaptiveOptions,
  type Body,
  type Motion,
  type SmoothOptions,
  type SpringOptions,
} from './motion'
export { caret, morph, type CaretOptions, type MorphOptions } from './shapes'
export { defaultSelectors } from './targets'
export { Particles, type ParticlesOptions } from './effects/particles'
export { Ripple, type RippleOptions } from './effects/ripple'
export { Trail, type TrailOptions } from './effects/trail'
export type {
  ActiveTarget,
  CursorEffect,
  CursorTarget,
  Frame,
  Point,
  PointerState,
  Rect,
  TargetOptions,
} from './types'
