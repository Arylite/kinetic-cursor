import { act, cleanup, render } from '@testing-library/react'
import { StrictMode, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  Cursor,
  CursorProvider,
  presets,
  useCursorFrame,
  useCursorState,
  useCursorTarget,
  type Frame,
} from '../src'
import { flushFrames, hover, pointer, restoreBrowser, stubBrowser } from './browser'

beforeEach(stubBrowser)
afterEach(() => {
  cleanup()
  restoreBrowser()
})

const root = () => document.querySelector('body > [aria-hidden="true"]')
const layerNames = () =>
  [...(root()?.querySelectorAll('[data-cursor-layer]') ?? [])].map((layer) =>
    layer.getAttribute('data-cursor-layer'),
  )

function enter(selector: string) {
  act(() => {
    pointer('pointermove', 40, 60)
    hover(document.querySelector(selector))
    flushFrames(3)
  })
}

function Target() {
  const ref = useRef<HTMLButtonElement>(null)
  useCursorTarget(ref, { kind: 'view', label: 'Open' })
  return <button ref={ref} data-testid="target" />
}

function StateProbe() {
  const { visible, target } = useCursorState()
  return <output data-testid="state">{visible ? (target?.kind ?? 'none') : 'hidden'}</output>
}

describe('Cursor', () => {
  it('renders nothing on the server', () => {
    const html = renderToString(
      <CursorProvider>
        <Cursor />
      </CursorProvider>,
    )
    expect(html).toBe('')
  })

  it('mounts layers, hides the native cursor and tracks targets', () => {
    const { getByTestId } = render(
      <StrictMode>
        <CursorProvider>
          <Target />
          <StateProbe />
          <Cursor />
        </CursorProvider>
      </StrictMode>,
    )
    expect(layerNames()).toEqual(['ring', 'dot'])
    expect(getByTestId('state').textContent).toBe('hidden')

    enter('[data-testid="target"]')

    expect(document.documentElement.hasAttribute('data-kinetic-cursor')).toBe(true)
    expect(getByTestId('state').textContent).toBe('view')
    expect(root()?.textContent).toBe('Open')
    expect(root()?.querySelector('[data-cursor-state="view"]')).not.toBeNull()
  })

  it.each(Object.entries(presets))('renders the %s preset', (_name, preset) => {
    render(
      <CursorProvider>
        <Target />
        <Cursor preset={preset} />
      </CursorProvider>,
    )
    enter('[data-testid="target"]')
    expect(layerNames()).toEqual(
      Object.entries(preset.layers ?? {}).flatMap(([name, layer]) => (layer ? [name] : [])),
    )
  })

  it('merges layers by name', () => {
    render(
      <CursorProvider>
        <Target />
        <Cursor preset="glide" layers={{ dot: false, ring: { size: 50 }, extra: { size: 4 } }} />
      </CursorProvider>,
    )
    enter('[data-testid="target"]')

    expect(layerNames()).toEqual(['ring', 'extra'])
    expect(root()?.textContent).toBe('Open')
  })

  it('removes effects with false', () => {
    render(
      <CursorProvider>
        <Cursor preset="ribbon" trail={false} />
      </CursorProvider>,
    )
    expect(root()?.querySelector('canvas')).toBeNull()
  })

  it('calls frame listeners while the cursor moves', () => {
    const listener = vi.fn<(frame: Frame) => void>()
    function Probe() {
      useCursorFrame(listener)
      return null
    }
    render(
      <CursorProvider>
        <Probe />
      </CursorProvider>,
    )
    act(() => {
      pointer('pointermove', 40, 60)
      flushFrames(2)
    })
    expect(listener).toHaveBeenCalled()
    expect(listener.mock.calls[0]?.[0].pointer.x).toBe(40)
  })

  it('cleans up on unmount', () => {
    const { unmount } = render(
      <CursorProvider>
        <Cursor />
      </CursorProvider>,
    )
    act(() => {
      pointer('pointermove', 10, 10)
      flushFrames()
    })
    unmount()
    expect(root()).toBeNull()
    expect(document.documentElement.hasAttribute('data-kinetic-cursor')).toBe(false)
  })
})
