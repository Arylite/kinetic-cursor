import { caret } from '../../core/shapes'
import { dot, precise } from './shared'
import type { CursorPreset } from './types'

/** A fine pen stroke that lingers. Designed for light backgrounds. */
export const ink: CursorPreset = {
  color: '#111',
  layers: {
    dot: {
      ...dot,
      stretch: 0,
      states: { link: { size: 12 }, button: { size: 12 }, text: caret() },
    },
  },
  trail: { motion: precise, width: 4, lifetime: 0.6, maxLength: 420, opacity: 0.85 },
}
