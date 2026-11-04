import { caret } from '../../core/shapes'
import { dot, precise } from './shared'
import type { CursorPreset } from './types'

/** A dot drawing a tapered ribbon along its path. */
export const ribbon: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: {
    dot: { ...dot, size: 8, stretch: 0, states: { button: { size: 28 }, text: caret() } },
  },
  trail: { motion: precise, width: 7, lifetime: 0.28, maxLength: 220 },
}
