import { caret } from '../../core/shapes'
import { dot } from './shared'
import type { CursorPreset } from './types'

/** Colorful confetti that falls away from the pointer and bursts on press. */
export const confetti: CursorPreset = {
  color: '#ff3d7f',
  layers: {
    dot: { ...dot, size: 8, states: { link: { size: 20 }, button: { size: 20 }, text: caret() } },
  },
  particles: {
    color: ['#ff3d7f', '#ffb400', '#00c2a8', '#4d7cff', '#b14dff'],
    spacing: 16,
    size: 6,
    lifetime: 1.1,
    inherit: 0.25,
    spread: 140,
    drag: 1.5,
    gravity: 700,
    burst: 24,
    max: 200,
  },
  ripple: { radius: 34, opacity: 0.8 },
}
