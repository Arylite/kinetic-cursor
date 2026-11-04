import { confetti } from './confetti'
import { crosshair } from './crosshair'
import { echo } from './echo'
import { frame } from './frame'
import { glass } from './glass'
import { glide } from './glide'
import { halo } from './halo'
import { ink } from './ink'
import { jelly } from './jelly'
import { lens } from './lens'
import { minimal } from './minimal'
import { neon } from './neon'
import { ribbon } from './ribbon'
import { sparkle } from './sparkle'
import { spotlight } from './spotlight'
import type { CursorPreset } from './types'

export type { CursorPreset, LayerConfig } from './types'
export {
  confetti,
  crosshair,
  echo,
  frame,
  glass,
  glide,
  halo,
  ink,
  jelly,
  lens,
  minimal,
  neon,
  ribbon,
  sparkle,
  spotlight,
}

export const presets = {
  glide,
  minimal,
  ribbon,
  sparkle,
  lens,
  halo,
  crosshair,
  jelly,
  confetti,
  spotlight,
  echo,
  frame,
  neon,
  ink,
  glass,
} satisfies Record<string, CursorPreset>

export type PresetName = keyof typeof presets
