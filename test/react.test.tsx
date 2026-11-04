import { act, cleanup, render } from '@testing-library/react'
import { StrictMode, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cursor, CursorProvider, useCursorState, useCursorTarget } from '../src'

let frames: FrameRequestCallback[] = []

function flushFrames(count = 1) {
  for (let i = 0; i < count; i++) {
    const pending = frames
    frames = []
    for (const callback of pending) callback(performance.now())
  }
}

function move(x: number, y: number) {
  window.dispatchEvent(
    new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse' }),
  )
}

beforeEach(() => {
  frames = []
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('pointer'),
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
  document.elementFromPoint = () => document.querySelector('[data-testid="target"]')
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute('data-kinetic-cursor')
})

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

    const root = document.querySelector('body > [aria-hidden="true"]')
    expect(root?.children).toHaveLength(2)
    expect(getByTestId('state').textContent).toBe('hidden')

    act(() => {
      move(40, 60)
      flushFrames(3)
    })

    expect(document.documentElement.hasAttribute('data-kinetic-cursor')).toBe(true)
    expect(getByTestId('state').textContent).toBe('view')
    expect(root?.textContent).toBe('Open')
    expect(root?.querySelector('[data-cursor-state="view"]')).not.toBeNull()
  })

  it('cleans up on unmount', () => {
    const { unmount } = render(
      <CursorProvider>
        <Cursor />
      </CursorProvider>,
    )
    act(() => {
      move(10, 10)
      flushFrames()
    })
    unmount()
    expect(document.querySelector('body > [aria-hidden="true"]')).toBeNull()
    expect(document.documentElement.hasAttribute('data-kinetic-cursor')).toBe(false)
  })
})
