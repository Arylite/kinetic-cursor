import { dot, outlined, precise, ring } from './shared'
import type { CursorPreset } from './types'

/** A glowing ring and dot with a short light streak. Designed for dark backgrounds. */
export const neon: CursorPreset = {
  color: '#3df5ff',
  layers: {
    ring: {
      ...ring,
      style: { ...outlined, boxShadow: '0 0 12px currentColor, inset 0 0 8px currentColor' },
    },
    dot: { ...dot, style: { ...dot.style, boxShadow: '0 0 10px currentColor' } },
  },
  trail: { motion: precise, width: 3, lifetime: 0.22, maxLength: 160, opacity: 0.6 },
}
