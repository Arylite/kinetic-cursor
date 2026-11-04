import { morph } from '../../core/shapes'
import { extend, filled, ring, trailing } from './shared'
import type { CursorPreset } from './types'

const square = { radius: 3 }

/** A square outline that frames every interactive element it reaches. */
export const frame: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: {
    frame: {
      ...ring,
      motion: trailing,
      size: 28,
      radius: 3,
      stretch: 0,
      states: {
        link: extend(morph({ padding: 4 }), square),
        button: extend(morph({ padding: 6 }), square),
        text: extend(morph({ padding: 4 }), square),
        label: { size: 84, radius: 4 },
      },
    },
    dot: {
      size: 4,
      radius: 0,
      style: filled,
      states: { button: { opacity: 0 }, label: { opacity: 0 } },
    },
  },
}
