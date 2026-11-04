import { spring } from '../../core/motion'
import { caret, morph } from '../../core/shapes'
import type { CursorPreset } from './types'

/** A frosted lens that blurs what is behind it and wraps around controls. */
export const glass: CursorPreset = {
  color: '#fff',
  layers: {
    lens: {
      label: true,
      motion: spring({ stiffness: 420, damping: 36, matchVelocity: 0.65 }),
      size: 44,
      stretch: 0.2,
      pressScale: 0.9,
      style: {
        display: 'grid',
        placeItems: 'center',
        background: 'rgb(255 255 255 / 0.08)',
        border: '1px solid rgb(255 255 255 / 0.3)',
        backdropFilter: 'blur(6px) saturate(1.4)',
      },
      states: {
        link: { size: 64 },
        button: morph({ padding: 6 }),
        text: caret({ width: 2 }),
        label: { size: 88, stretch: 0 },
      },
    },
  },
}
