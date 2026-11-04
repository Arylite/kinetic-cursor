import { spring } from '../../core/motion'
import { caret } from '../../core/shapes'
import { outlined } from './shared'
import type { CursorPreset } from './types'

/** A large inverting disc that swells over interactive elements. */
export const lens: CursorPreset = {
  color: '#000',
  blendMode: 'difference',
  layers: {
    disc: {
      label: true,
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
  },
}
