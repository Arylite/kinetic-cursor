import type { CursorTarget, TargetOptions } from './types'

const DEFAULT_MAGNETIC = 0.3
const ATTRIBUTES = '[data-cursor], [data-cursor-label], [data-cursor-magnetic]'

const textInputs = ['text', 'email', 'search', 'url', 'tel', 'password', 'number']

export const defaultSelectors: Readonly<Record<string, string>> = {
  text: [
    'textarea:not(:disabled)',
    'input:not([type]):not(:disabled)',
    ...textInputs.map((type) => `input[type="${type}"]:not(:disabled)`),
    '[contenteditable=""]',
    '[contenteditable="true"]',
  ].join(', '),
  button: [
    'button:not(:disabled)',
    'select:not(:disabled)',
    'input[type="button"]:not(:disabled)',
    'input[type="submit"]:not(:disabled)',
    'input[type="reset"]:not(:disabled)',
    '[role="button"]',
    'summary',
  ].join(', '),
  link: 'a[href], area[href]',
}

export function resolveTarget(
  start: Element | null,
  selectors: Readonly<Record<string, string>>,
  registry: WeakMap<Element, TargetOptions>,
): CursorTarget | null {
  const interactive = Object.values(selectors).join(', ')
  for (let element = start; element; element = element.parentElement) {
    const options = registry.get(element)
    if (options || element.matches(ATTRIBUTES) || element.matches(interactive)) {
      return createTarget(element, options, selectors)
    }
  }
  return null
}

function createTarget(
  element: Element,
  options: TargetOptions | undefined,
  selectors: Readonly<Record<string, string>>,
): CursorTarget {
  const label = options?.label ?? attribute(element, 'data-cursor-label')
  const kind =
    options?.kind ??
    attribute(element, 'data-cursor') ??
    (label ? 'label' : matchKind(element, selectors)) ??
    'custom'
  const magnetic = options?.magnetic ?? parseMagnetic(element.getAttribute('data-cursor-magnetic'))
  return { kind, element, label, magnetic: Math.min(Math.max(magnetic, 0), 1) }
}

function matchKind(element: Element, selectors: Readonly<Record<string, string>>): string | null {
  return Object.keys(selectors).find((kind) => element.matches(selectors[kind])) ?? null
}

function attribute(element: Element, name: string): string | null {
  return element.getAttribute(name) || null
}

function parseMagnetic(value: string | null): number {
  if (value === null) return 0
  if (value === '') return DEFAULT_MAGNETIC
  return Number(value) || 0
}
