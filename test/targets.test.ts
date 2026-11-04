import { describe, expect, it } from 'vitest'
import { defaultSelectors, resolveTarget } from '../src/core/targets'
import type { TargetOptions } from '../src/core/types'

function render(html: string): HTMLElement {
  document.body.innerHTML = html
  const element = document.querySelector<HTMLElement>('#start')
  if (!element) throw new Error('missing #start')
  return element
}

const resolve = (start: Element, registry = new WeakMap<Element, TargetOptions>()) =>
  resolveTarget(start, defaultSelectors, registry)

describe('resolveTarget', () => {
  it('classifies the closest interactive ancestor', () => {
    expect(resolve(render('<a href="#"><span id="start">link</span></a>'))?.kind).toBe('link')
    expect(resolve(render('<button><b id="start">go</b></button>'))?.kind).toBe('button')
    expect(resolve(render('<input id="start" type="email">'))?.kind).toBe('text')
  })

  it('ignores disabled controls and plain content', () => {
    expect(resolve(render('<button disabled><b id="start">go</b></button>'))).toBeNull()
    expect(resolve(render('<p id="start">text</p>'))).toBeNull()
  })

  it('reads data attributes', () => {
    const target = resolve(
      render('<div data-cursor-label="Open" data-cursor-magnetic><i id="start"></i></div>'),
    )
    expect(target).toMatchObject({ kind: 'label', label: 'Open', magnetic: 0.3 })
    expect(resolve(render('<a href="#" data-cursor="native" id="start"></a>'))?.kind).toBe('native')
  })

  it('prefers registered options over attributes', () => {
    const start = render('<a href="#" data-cursor="link" id="start"></a>')
    const registry = new WeakMap<Element, TargetOptions>([[start, { kind: 'view', magnetic: 2 }]])
    expect(resolve(start, registry)).toMatchObject({ kind: 'view', magnetic: 1 })
  })
})
