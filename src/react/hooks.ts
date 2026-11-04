import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefCallback,
  type RefObject,
} from 'react'
import type { CursorState } from '../core/engine'
import type { Layer, LayerOptions } from '../core/layer'
import type { CursorEffect, Frame, TargetOptions } from '../core/types'
import { useCursorEngine } from './context'

const serverState: CursorState = { enabled: false, visible: false, pressed: false, target: null }
const getServerState = (): CursorState => serverState
const noop = (): void => undefined
const subscribeNever = (): (() => void) => noop

/** Discrete cursor state. Re-renders only when visibility, press or target change. */
export function useCursorState(): CursorState {
  const engine = useCursorEngine()
  return useSyncExternalStore(engine.subscribe, engine.getState, getServerState)
}

/** Returns a ref that turns an element into a cursor layer driven by the engine. */
export function useCursorLayer<T extends HTMLElement>(options: LayerOptions): RefCallback<T> {
  const engine = useCursorEngine()
  const optionsRef = useRef(options)
  const layerRef = useRef<Layer | null>(null)

  useEffect(() => {
    optionsRef.current = options
    layerRef.current?.configure(options)
  })

  return useCallback(
    (element: T | null) => {
      if (layerRef.current) engine.removeLayer(layerRef.current)
      layerRef.current = element ? engine.addLayer(element, optionsRef.current) : null
    },
    [engine],
  )
}

interface ConfigurableEffect<O> extends CursorEffect {
  configure(options: O): void
}

/** Mounts a canvas effect for the lifetime of the component. */
export function useCursorEffect<O>(
  create: (options: O) => ConfigurableEffect<O>,
  options: O,
): void {
  const engine = useCursorEngine()
  const [effect] = useState(() => create(options))

  useEffect(() => {
    effect.configure(options)
  })

  useEffect(() => engine.addEffect(effect), [engine, effect])
}

/** Calls `callback` on every animation frame while the cursor is in motion. */
export function useCursorFrame(callback: (frame: Frame) => void): void {
  const engine = useCursorEngine()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(
    () =>
      engine.onFrame((frame) => {
        callbackRef.current(frame)
      }),
    [engine],
  )
}

/** Assigns cursor behavior to an element without data attributes. */
export function useCursorTarget(ref: RefObject<Element | null>, options: TargetOptions): void {
  const engine = useCursorEngine()
  const { kind, label, magnetic } = options

  useEffect(() => {
    const element = ref.current
    if (!element) return
    return engine.registerTarget(element, { kind, label, magnetic })
  }, [engine, ref, kind, label, magnetic])
}

export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  )
}
