import { Layer, type LayerOptions } from './layer'
import { createBody, isSettled, spring, type Body, type Motion } from './motion'
import { PointerTracker } from './pointer'
import { defaultSelectors, resolveTarget } from './targets'
import type { ActiveTarget, CursorEffect, CursorTarget, Frame, Rect, TargetOptions } from './types'

export interface EngineOptions {
  /**
   * `'auto'` enables the cursor only when a hovering, fine pointer is available
   * and forced-colors mode is off.
   */
  enabled?: boolean | 'auto'
  hideNativeCursor?: boolean
  /** `'user'` follows `prefers-reduced-motion`. */
  reducedMotion?: 'user' | 'always' | 'never'
  /** Selectors keyed by target kind, merged over the defaults. */
  selectors?: Readonly<Record<string, string>>
  /** Motion of magnetic elements as they follow and release the pointer. */
  magneticMotion?: Motion
  zIndex?: number
}

export interface LayerHandle {
  configure(options: LayerOptions): void
  remove(): void
}

export interface CursorState {
  readonly enabled: boolean
  readonly visible: boolean
  readonly pressed: boolean
  readonly target: CursorTarget | null
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] }

interface TrackedTarget extends Mutable<ActiveTarget> {
  base: Rect
  rect: Rect
}

const ACTIVE_ATTRIBUTE = 'data-kinetic-cursor'
const NATIVE_KIND = 'native'
const HIDE_NATIVE_CURSOR = `html[${ACTIVE_ATTRIBUTE}], html[${ACTIVE_ATTRIBUTE}] * { cursor: none !important; }`
const MAX_DT = 0.1
const defaultMagneticMotion = spring({ stiffness: 240, damping: 22 })

export class CursorEngine {
  readonly root: HTMLDivElement | null
  private options: EngineOptions
  private state: CursorState = { enabled: false, visible: false, pressed: false, target: null }
  private readonly pointer = new PointerTracker()
  private readonly frame: Mutable<Frame>
  private readonly layers = new Set<Layer>()
  private readonly effects = new Set<CursorEffect>()
  private readonly listeners = new Set<() => void>()
  private readonly frameListeners = new Set<(frame: Frame) => void>()
  private readonly registry = new WeakMap<Element, TargetOptions>()
  private readonly magnets = new Map<Element, Body>()
  private active: TrackedTarget | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null
  private style: HTMLStyleElement | null = null
  private abort: AbortController | null = null
  private media: Record<'pointer' | 'forcedColors' | 'reducedMotion', MediaQueryList> | null = null
  private frameId = 0
  private lastTime: number | null = null
  private color = ''
  private targetDirty = false
  private rectDirty = false
  private canvasDirty = false

  constructor(options: EngineOptions = {}) {
    this.options = options
    this.frame = {
      time: 0,
      dt: 0,
      pointer: this.pointer,
      pressed: false,
      visible: false,
      target: null,
    }
    this.root = typeof document === 'undefined' ? null : createRoot()
  }

  configure(options: EngineOptions): void {
    this.options = options
    this.targetDirty = true
    this.refresh()
  }

  connect(): void {
    if (this.abort || !this.root) return
    const abort = new AbortController()
    const signal = abort.signal
    const passive = { passive: true, signal }
    this.abort = abort

    document.body.append(this.root)
    this.style = document.createElement('style')
    this.style.textContent = HIDE_NATIVE_CURSOR
    document.head.append(this.style)

    this.media = {
      pointer: matchMedia('(any-hover: hover) and (any-pointer: fine)'),
      forcedColors: matchMedia('(forced-colors: active)'),
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)'),
    }
    for (const query of Object.values(this.media)) {
      query.addEventListener('change', this.refresh, { signal })
    }

    window.addEventListener('pointermove', this.handleMove, passive)
    window.addEventListener('pointerdown', this.handleDown, passive)
    window.addEventListener('pointerup', this.handleUp, passive)
    window.addEventListener('pointercancel', this.handleUp, passive)
    window.addEventListener('resize', this.handleResize, passive)
    window.addEventListener('scroll', this.handleScroll, { ...passive, capture: true })
    document.addEventListener('pointerover', this.handleOver, passive)
    document.addEventListener('pointerout', this.handleOut, passive)

    if (this.effects.size) this.attachCanvas()
    this.refresh()
  }

  disconnect(): void {
    if (!this.abort) return
    this.abort.abort()
    this.abort = null
    this.media = null
    this.stop()
    this.releaseMagnets()
    this.root?.remove()
    this.style?.remove()
    this.style = null
    this.active = null
    this.pointer.reset()
    document.documentElement.removeAttribute(ACTIVE_ATTRIBUTE)
    this.setState({ enabled: false, visible: false, pressed: false, target: null })
  }

  /** Sets the color inherited by layers and effects, and how the cursor blends with the page. */
  setAppearance({ color = '', blendMode = '' }: { color?: string; blendMode?: string }): void {
    if (!this.root) return
    this.root.style.color = color
    this.root.style.mixBlendMode = blendMode
    this.color = getComputedStyle(this.root).color
    this.canvasDirty = true
    this.wake()
  }

  /** Drives an element inside `root` as a cursor layer. */
  addLayer(element: HTMLElement, options: LayerOptions): LayerHandle {
    const layer = new Layer(element, options)
    this.layers.add(layer)
    this.wake()
    return {
      configure: (next) => {
        layer.configure(next)
        this.wake()
      },
      remove: () => {
        this.layers.delete(layer)
      },
    }
  }

  addEffect(effect: CursorEffect): () => void {
    this.effects.add(effect)
    this.attachCanvas()
    this.wake()
    return () => {
      this.effects.delete(effect)
      if (!this.effects.size) this.detachCanvas()
      this.canvasDirty = true
      this.wake()
    }
  }

  /** Assigns cursor behavior to an element, taking precedence over its data attributes. */
  registerTarget(element: Element, options: TargetOptions): () => void {
    this.registry.set(element, options)
    this.invalidateTarget()
    return () => {
      if (this.registry.get(element) === options) this.registry.delete(element)
      this.invalidateTarget()
    }
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getState = (): CursorState => this.state

  /** Runs after every animation frame while the cursor is in motion. */
  onFrame(listener: (frame: Frame) => void): () => void {
    this.frameListeners.add(listener)
    this.wake()
    return () => this.frameListeners.delete(listener)
  }

  private get reducedMotion(): boolean {
    const { reducedMotion = 'user' } = this.options
    if (reducedMotion === 'user') return this.media?.reducedMotion.matches ?? false
    return reducedMotion === 'always'
  }

  private readonly refresh = (): void => {
    if (!this.root) return
    const { enabled = 'auto', zIndex = 2147483647 } = this.options
    const capable = this.media
      ? this.media.pointer.matches && !this.media.forcedColors.matches
      : false
    const active = this.abort !== null && (enabled === 'auto' ? capable : enabled)

    this.root.style.zIndex = String(zIndex)
    this.root.style.display = active ? '' : 'none'
    if (active) {
      this.setState({ enabled: true })
    } else {
      this.stop()
      this.releaseMagnets()
      this.active = null
      this.setState({ enabled: false, visible: false, pressed: false, target: null })
    }
    this.syncNativeCursor()
    this.wake()
  }

  private readonly handleMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.hide()
      return
    }
    this.pointer.record(event.clientX, event.clientY, event.timeStamp)
    if (!this.state.visible && this.state.enabled) {
      this.targetDirty = true
      this.setState({ visible: true })
      this.syncNativeCursor()
    }
    this.wake()
  }

  private readonly handleDown = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.hide()
      return
    }
    this.pointer.record(event.clientX, event.clientY, event.timeStamp)
    this.setState({ pressed: true })
    if (this.state.visible && !this.reducedMotion) {
      for (const effect of this.effects) effect.press?.(event.clientX, event.clientY)
    }
    this.wake()
  }

  private readonly handleUp = (): void => {
    this.setState({ pressed: false })
    this.wake()
  }

  private readonly handleOver = (): void => {
    this.invalidateTarget()
  }

  private readonly handleOut = (event: PointerEvent): void => {
    if (!event.relatedTarget) this.hide()
  }

  private readonly handleScroll = (): void => {
    this.rectDirty = true
    this.invalidateTarget()
  }

  private readonly handleResize = (): void => {
    this.rectDirty = true
    this.resizeCanvas()
    this.wake()
  }

  private hide(): void {
    if (!this.state.visible) return
    this.active = null
    this.setState({ visible: false, pressed: false, target: null })
    this.syncNativeCursor()
    this.wake()
  }

  private invalidateTarget(): void {
    this.targetDirty = true
    this.wake()
  }

  private wake(): void {
    if (!this.frameId && this.abort && this.state.enabled) {
      this.frameId = requestAnimationFrame(this.tick)
    }
  }

  private stop(): void {
    cancelAnimationFrame(this.frameId)
    this.frameId = 0
    this.lastTime = null
  }

  private readonly tick = (now: number): void => {
    this.frameId = 0
    const time = now / 1000
    if (this.lastTime === null && this.root) this.color = getComputedStyle(this.root).color
    const dt = this.lastTime === null ? 1 / 60 : Math.min(time - this.lastTime, MAX_DT)
    this.lastTime = time

    this.pointer.update(now)
    this.updateTarget()

    const frame = this.frame
    const reduced = this.reducedMotion
    frame.time = time
    frame.dt = dt
    frame.pressed = this.state.pressed
    frame.visible = this.state.visible && this.active?.kind !== NATIVE_KIND
    frame.target = this.active

    let busy = this.updateMagnets(frame, reduced)
    for (const layer of this.layers) busy = !layer.update(frame, reduced) || busy
    busy = this.drawEffects(frame, reduced) || busy
    for (const listener of this.frameListeners) listener(frame)

    if (busy) this.wake()
    else this.lastTime = null
  }

  private updateTarget(): void {
    if (this.targetDirty && this.state.visible) {
      this.targetDirty = false
      const element = document.elementFromPoint(this.pointer.x, this.pointer.y)
      const selectors = { ...defaultSelectors, ...this.options.selectors }
      const target = resolveTarget(element, selectors, this.registry)
      if (!isSameTarget(target, this.active)) {
        this.active = target && this.track(target)
        this.setState({ target })
        this.syncNativeCursor()
      }
    }
    if (this.rectDirty && this.active) {
      this.active.base = this.measure(this.active.element)
    }
    this.rectDirty = false
  }

  private track(target: CursorTarget): TrackedTarget {
    const base = this.measure(target.element)
    const style = getComputedStyle(target.element)
    return {
      ...target,
      base,
      rect: { ...base },
      radius: parseLength(style.borderTopLeftRadius, Math.min(base.width, base.height)),
      fontSize: parseFloat(style.fontSize) || 16,
    }
  }

  private measure(element: Element): Rect {
    const rect = element.getBoundingClientRect()
    const offset = this.magnets.get(element)?.value ?? [0, 0]
    return {
      x: rect.left - offset[0],
      y: rect.top - offset[1],
      width: rect.width,
      height: rect.height,
    }
  }

  private updateMagnets(frame: Frame, reduced: boolean): boolean {
    const target = this.active
    const engaged =
      target && target.magnetic > 0 && frame.visible && !reduced ? target.element : null
    if (engaged && !this.magnets.has(engaged)) this.magnets.set(engaged, createBody([0, 0]))

    const motion = this.options.magneticMotion ?? defaultMagneticMotion
    let busy = false
    for (const [element, body] of this.magnets) {
      const goal = [0, 0]
      if (element === engaged && target) {
        const { base, magnetic } = target
        goal[0] = (frame.pointer.x - (base.x + base.width / 2)) * magnetic
        goal[1] = (frame.pointer.y - (base.y + base.height / 2)) * magnetic
      }
      motion(body, goal, null, frame.dt)
      if (element !== engaged && isSettled(body, goal, 0.05)) {
        setTranslate(element, '')
        this.magnets.delete(element)
        continue
      }
      busy ||= !isSettled(body, goal, 0.05)
      setTranslate(element, `${body.value[0].toFixed(2)}px ${body.value[1].toFixed(2)}px`)
    }

    if (target) {
      const offset = this.magnets.get(target.element)?.value ?? [0, 0]
      target.rect.x = target.base.x + offset[0]
      target.rect.y = target.base.y + offset[1]
      target.rect.width = target.base.width
      target.rect.height = target.base.height
    }
    return busy
  }

  private releaseMagnets(): void {
    for (const element of this.magnets.keys()) setTranslate(element, '')
    this.magnets.clear()
  }

  private drawEffects(frame: Frame, reduced: boolean): boolean {
    const { canvas, context } = this
    if (!canvas || !context) return false

    let busy = false
    if (!reduced) {
      for (const effect of this.effects) {
        effect.update(frame)
        busy ||= !effect.idle
      }
    }
    if (!busy && !this.canvasDirty) return false

    const ratio = window.devicePixelRatio || 1
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (!reduced) {
      for (const effect of this.effects) {
        context.save()
        context.fillStyle = this.color
        context.strokeStyle = this.color
        effect.draw(context)
        context.restore()
      }
    }
    this.canvasDirty = busy
    return busy
  }

  private attachCanvas(): void {
    if (this.canvas || !this.root || !this.abort) return
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%'
    this.root.prepend(canvas)
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.resizeCanvas()
  }

  private detachCanvas(): void {
    this.canvas?.remove()
    this.canvas = null
    this.context = null
  }

  private resizeCanvas(): void {
    if (!this.canvas) return
    const ratio = window.devicePixelRatio || 1
    this.canvas.width = Math.round(window.innerWidth * ratio)
    this.canvas.height = Math.round(window.innerHeight * ratio)
    this.canvasDirty = true
  }

  private syncNativeCursor(): void {
    const { hideNativeCursor = true } = this.options
    const { enabled, visible } = this.state
    const hide = hideNativeCursor && enabled && visible && this.active?.kind !== NATIVE_KIND
    if (this.abort) document.documentElement.toggleAttribute(ACTIVE_ATTRIBUTE, hide)
  }

  private setState(patch: Partial<CursorState>): void {
    const next = { ...this.state, ...patch }
    const previous = this.state
    if (
      next.enabled === previous.enabled &&
      next.visible === previous.visible &&
      next.pressed === previous.pressed &&
      next.target === previous.target
    ) {
      return
    }
    this.state = next
    for (const listener of this.listeners) listener()
  }
}

function createRoot(): HTMLDivElement {
  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;overflow:hidden;contain:strict'
  return root
}

function setTranslate(element: Element, value: string): void {
  if (element instanceof HTMLElement || element instanceof SVGElement) {
    element.style.translate = value
  }
}

function isSameTarget(a: CursorTarget | null, b: CursorTarget | null): boolean {
  return (
    a?.element === b?.element &&
    a?.kind === b?.kind &&
    a?.label === b?.label &&
    a?.magnetic === b?.magnetic
  )
}

function parseLength(value: string, reference: number): number {
  const number = parseFloat(value) || 0
  return value.endsWith('%') ? (number / 100) * reference : number
}
