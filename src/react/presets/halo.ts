import { spring } from '../../core/motion'
import { caret, morph } from '../../core/shapes'
import { extend, filled, precise } from './shared'
import type { CursorPreset } from './types'

/** A translucent disc that becomes a highlight behind links and controls. */
export const halo: CursorPreset = {
  color: 'rgb(128 128 136)',
  layers: {
    highlight: {
      label: true,
      motion: spring({ stiffness: 700, damping: 52, matchVelocity: 0.8 }),
      size: 22,
      opacity: 0.35,
      stretch: 0.15,
      pressScale: 0.85,
      style: { ...filled, display: 'grid', placeItems: 'center' },
      states: {
        link: extend(morph({ padding: 4, parallax: 0.06 }), { opacity: 0.16 }),
        button: extend(morph({ padding: 3, parallax: 0.06 }), { opacity: 0.16 }),
        text: { size: 6, opacity: 0 },
        label: { size: 72, opacity: 0.5, stretch: 0 },
      },
    },
    caret: {
      motion: precise,
      size: 4,
      opacity: 0,
      style: filled,
      states: { text: extend(caret(), { opacity: 1 }) },
    },
  },
}
