import { dot, ring } from './shared'
import type { CursorPreset } from './types'

/** A crisp dot with a ring that trails softly and wraps around controls. */
export const glide: CursorPreset = {
  color: '#fff',
  blendMode: 'difference',
  layers: { ring, dot },
}
