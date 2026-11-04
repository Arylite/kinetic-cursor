import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CursorLabel } from './CursorLabel'
import { CursorLayer } from './CursorLayer'
import { useCursorEngine } from './context'
import { CursorParticles, CursorRipple, CursorTrail } from './effects'
import { useIsClient } from './hooks'
import { presets, type CursorPreset, type LayerConfig, type PresetName } from './presets'

export interface CursorProps extends CursorPreset {
  /** A preset name or object. Other props are merged over it. */
  preset?: PresetName | CursorPreset
  /** Additional layers or effects rendered on top of the preset. */
  children?: ReactNode
}

type LayerMap = NonNullable<CursorPreset['layers']>

export function Cursor({ preset = 'glide', children, ...overrides }: CursorProps): ReactNode {
  const engine = useCursorEngine()
  const isClient = useIsClient()
  const base = typeof preset === 'string' ? presets[preset] : preset
  const color = overrides.color ?? base.color
  const blendMode = overrides.blendMode ?? base.blendMode
  const layers = mergeLayers(base.layers, overrides.layers)
  const trail = merge(base.trail, overrides.trail)
  const particles = merge(base.particles, overrides.particles)
  const ripple = merge(base.ripple, overrides.ripple)

  useEffect(() => {
    engine.setAppearance({ color, blendMode })
  }, [engine, color, blendMode])

  if (!isClient || !engine.root) return null

  return createPortal(
    <>
      {layers.map(([name, { label, ...layer }]) => (
        <CursorLayer key={name} name={name} {...layer}>
          {label && <CursorLabel />}
        </CursorLayer>
      ))}
      {trail && <CursorTrail {...trail} />}
      {particles && <CursorParticles {...particles} />}
      {ripple && <CursorRipple {...ripple} />}
      {children}
    </>,
    engine.root,
  )
}

function merge<T extends object>(
  base: T | false | undefined,
  override: T | false | undefined,
): T | false | undefined {
  if (override === undefined) return base
  if (override === false || !base) return override
  return { ...base, ...override }
}

function mergeLayers(base: LayerMap = {}, override: LayerMap = {}): [string, LayerConfig][] {
  const names = new Set([...Object.keys(base), ...Object.keys(override)])
  return [...names].flatMap((name): [string, LayerConfig][] => {
    const layer = merge(base[name], override[name])
    if (!layer) return []
    const original = base[name]
    const patch = override[name]
    if (!original || !patch) return [[name, layer]]
    return [
      [
        name,
        {
          ...layer,
          style: { ...original.style, ...patch.style },
          states: { ...original.states, ...patch.states },
        },
      ],
    ]
  })
}
