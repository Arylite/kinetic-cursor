import { spring } from '../../core/motion'
import { morph } from '../../core/shapes'
import { dot, ring } from './shared'
import type { CursorPreset } from './types'

/** A loose, bouncy ring that wobbles and stretches behind a small dot. */
export const jelly: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: {
    ring: {
      ...ring,
      motion: spring({ stiffness: 180, damping: 12, matchVelocity: 0.3 }),
      shapeMotion: spring({ stiffness: 300, damping: 14 }),
      size: 40,
      stretch: 0.6,
      pressScale: 0.7,
      states: { ...ring.states, link: { size: 64 }, button: morph({ padding: 8 }) },
    },
    dot,
  },
}
