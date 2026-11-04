import { caret } from '../../core/shapes'
import { filled, precise } from './shared'
import type { CursorPreset } from './types'

/** Two thin bars crossing at the pointer, for precise, technical interfaces. */
export const crosshair: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: {
    vertical: {
      motion: precise,
      width: 1.5,
      height: 22,
      pressScale: 0.6,
      style: filled,
      states: {
        link: { height: 34 },
        button: { height: 34 },
        label: { height: 34 },
        text: { height: 0, opacity: 0 },
      },
    },
    horizontal: {
      motion: precise,
      width: 22,
      height: 1.5,
      pressScale: 0.6,
      style: filled,
      states: { link: { width: 34 }, button: { width: 34 }, label: { width: 34 }, text: caret() },
    },
  },
}
