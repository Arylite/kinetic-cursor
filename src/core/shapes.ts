import type { ShapeRule } from './layer'

export interface MorphOptions {
  /** Space between the element edge and the layer, in px. */
  padding?: number
  /** How much the layer leans toward the pointer inside the element, from 0 to 1. */
  parallax?: number
}

/** Wraps the hovered element, matching its size and corner radius. */
export function morph({ padding = 6, parallax = 0.1 }: MorphOptions = {}): ShapeRule {
  return ({ target, pointer }) => {
    const { rect } = target
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const width = rect.width + padding * 2
    const height = rect.height + padding * 2
    return {
      x: cx + (pointer.x - cx) * parallax,
      y: cy + (pointer.y - cy) * parallax,
      width,
      height,
      radius: Math.min(target.radius + padding, Math.min(width, height) / 2),
      stretch: 0,
    }
  }
}

export interface CaretOptions {
  width?: number
  /** Caret height relative to the element font size. */
  lineHeight?: number
}

/** Turns the layer into a text caret sized to the hovered element's font. */
export function caret({ width = 2, lineHeight = 1.3 }: CaretOptions = {}): ShapeRule {
  return ({ target }) => ({
    width,
    height: target.fontSize * lineHeight,
    radius: width / 2,
    stretch: 0,
  })
}
