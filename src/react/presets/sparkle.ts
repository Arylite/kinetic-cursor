import { caret } from '../../core/shapes'
import { dot } from './shared'
import type { CursorPreset } from './types'

/** A warm dot that sheds drifting particles and ripples on press. */
export const sparkle: CursorPreset = {
  color: '#ff5c39',
  layers: {
    dot: { ...dot, size: 8, states: { link: { size: 20 }, button: { size: 20 }, text: caret() } },
  },
  particles: { color: ['#ff5c39', '#ffb03a', '#ffd36e'], size: 5, spread: 40, burst: 10 },
  ripple: { radius: 30, opacity: 0.7 },
}
