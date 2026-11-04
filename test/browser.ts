import { vi } from 'vitest'
import type { Frame } from '../src/core/types'

export const media = { finePointer: true, reducedMotion: false }

let frames: FrameRequestCallback[] = []
let now = 0
let hovered: Element | null = null

export function stubBrowser(): void {
  frames = []
  now = 0
  hovered = null
  media.finePointer = true
  media.reducedMotion = false

  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      if (query.includes('reduced-motion')) return media.reducedMotion
      if (query.includes('forced-colors')) return false
      return media.finePointer
    },
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  document.elementFromPoint = () => hovered
}

export function restoreBrowser(): void {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-kinetic-cursor')
}

export function flushFrames(count = 1): void {
  for (let i = 0; i < count; i++) {
    now += 1000 / 60
    const pending = frames
    frames = []
    for (const callback of pending) callback(now)
  }
}

export function hover(element: Element | null): void {
  hovered = element
  document.dispatchEvent(new PointerEvent('pointerover'))
}

export function pointer(type: string, x: number, y: number, pointerType = 'mouse'): void {
  window.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerType }))
}

export function frame(time: number, x: number, vx = 0, visible = true): Frame {
  return {
    time,
    dt: 1 / 60,
    pointer: { x, y: 0, vx, vy: 0 },
    pressed: false,
    visible,
    target: null,
  }
}

export function recordingContext(): { context: CanvasRenderingContext2D; arcs: () => number } {
  const arc = vi.fn()
  const context = {
    arc,
    beginPath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
  }
  return {
    context: context as unknown as CanvasRenderingContext2D,
    arcs: () => arc.mock.calls.length,
  }
}
