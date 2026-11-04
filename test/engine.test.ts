import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CursorEngine, type EngineOptions } from '../src/core/engine'
import type { LayerOptions } from '../src/core/layer'
import { morph } from '../src/core/shapes'
import type { CursorEffect } from '../src/core/types'
import { flushFrames, hover, media, pointer, restoreBrowser, stubBrowser } from './browser'

let engine: CursorEngine

function setup(options: EngineOptions = {}, layerOptions: LayerOptions = { size: 10 }) {
  engine = new CursorEngine(options)
  engine.connect()
  const element = document.createElement('div')
  engine.root?.append(element)
  const layer = engine.addLayer(element, layerOptions)
  return { element, layer }
}

function button(magnetic = ''): HTMLButtonElement {
  const element = document.createElement('button')
  element.setAttribute('data-cursor-magnetic', magnetic)
  element.getBoundingClientRect = () => new DOMRect(100, 100, 100, 40)
  document.body.append(element)
  return element
}

const nativeHidden = () => document.documentElement.hasAttribute('data-kinetic-cursor')

beforeEach(stubBrowser)
afterEach(() => {
  engine.disconnect()
  restoreBrowser()
})

describe('CursorEngine', () => {
  it('appears on the first move and hides the native cursor', () => {
    const { element } = setup()
    expect(engine.getState().visible).toBe(false)

    pointer('pointermove', 40, 60)
    flushFrames(30)

    expect(engine.getState().visible).toBe(true)
    expect(nativeHidden()).toBe(true)
    expect(Number(element.style.opacity)).toBeGreaterThan(0.9)
  })

  it('hides when the pointer leaves the window', () => {
    setup()
    pointer('pointermove', 40, 60)
    document.dispatchEvent(new PointerEvent('pointerout', { relatedTarget: null }))

    expect(engine.getState().visible).toBe(false)
    expect(nativeHidden()).toBe(false)
  })

  it('ignores touch input', () => {
    setup()
    pointer('pointermove', 40, 60, 'touch')
    expect(engine.getState().visible).toBe(false)
  })

  it('stays off without a hovering fine pointer', () => {
    media.finePointer = false
    setup()
    pointer('pointermove', 40, 60)

    expect(engine.getState().enabled).toBe(false)
    expect(engine.root?.style.display).toBe('none')
    expect(nativeHidden()).toBe(false)
  })

  it('restores the native cursor over native targets', () => {
    setup()
    const canvas = document.createElement('canvas')
    canvas.setAttribute('data-cursor', 'native')
    document.body.append(canvas)

    pointer('pointermove', 40, 60)
    hover(canvas)
    flushFrames()

    expect(engine.getState().target?.kind).toBe('native')
    expect(nativeHidden()).toBe(false)
  })

  it('notifies subscribers only when discrete state changes', () => {
    setup()
    const target = button()
    const listener = vi.fn()
    engine.subscribe(listener)

    pointer('pointermove', 150, 120)
    hover(target)
    flushFrames()
    const calls = listener.mock.calls.length

    for (let x = 151; x < 160; x++) pointer('pointermove', x, 120)
    flushFrames(5)
    expect(listener).toHaveBeenCalledTimes(calls)
  })

  it('pulls magnetic elements toward the pointer and releases them', () => {
    setup()
    const target = button('0.5')
    pointer('pointermove', 190, 120)
    hover(target)
    flushFrames(240)
    expect(parseFloat(target.style.translate)).toBeCloseTo(20, 1)

    hover(null)
    pointer('pointermove', 400, 400)
    flushFrames(240)
    expect(target.style.translate).toBe('')
  })

  it('morphs layers around the hovered element', () => {
    const { element } = setup(
      { reducedMotion: 'always' },
      { size: 10, states: { button: morph({ padding: 4, parallax: 0 }) } },
    )
    pointer('pointermove', 150, 120)
    hover(button())
    flushFrames(2)

    expect(element.style.width).toBe('108px')
    expect(element.style.height).toBe('48px')
    expect(element.style.transform).toContain('translate3d(96.00px, 96.00px, 0)')
    expect(element.dataset.cursorState).toBe('button')
  })

  it('follows the pointer exactly and skips magnets with reduced motion', () => {
    const { element } = setup({ reducedMotion: 'always' })
    const target = button('0.5')
    pointer('pointermove', 40, 60)
    flushFrames()
    pointer('pointermove', 190, 120)
    hover(target)
    flushFrames()

    expect(element.style.transform).toContain('translate3d(185.00px, 115.00px, 0)')
    expect(target.style.translate).toBe('')
  })

  it('stops driving a removed layer', () => {
    const { element, layer } = setup()
    layer.remove()
    pointer('pointermove', 40, 60)
    flushFrames(5)
    expect(element.style.transform).toBe('')
  })

  it('applies new layer options through the handle', () => {
    const { element, layer } = setup({ reducedMotion: 'always' })
    pointer('pointermove', 40, 60)
    flushFrames()
    layer.configure({ size: 24 })
    flushFrames()
    expect(element.style.width).toBe('24px')
  })

  it('forwards presses to effects', () => {
    setup()
    const press = vi.fn()
    const effect: CursorEffect = { update: vi.fn(), draw: vi.fn(), press, idle: true }
    engine.addEffect(effect)

    pointer('pointermove', 40, 60)
    pointer('pointerdown', 40, 60)

    expect(press).toHaveBeenCalledWith(40, 60)
    expect(engine.getState().pressed).toBe(true)
  })

  it('cleans up everything on disconnect', () => {
    setup()
    const target = button('0.5')
    pointer('pointermove', 190, 120)
    hover(target)
    flushFrames(10)

    engine.disconnect()
    expect(target.style.translate).toBe('')
    expect(engine.root?.isConnected).toBe(false)
    expect(nativeHidden()).toBe(false)
  })
})
