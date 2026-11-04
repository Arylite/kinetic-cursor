import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CursorLayer } from './CursorLayer'
import { useCursorEngine } from './context'
import { CursorParticles, CursorRipple, CursorTrail } from './effects'
import { useCursorState, useIsClient } from './hooks'
import { presets, type CursorPreset, type LayerConfig } from './presets'

export interface CursorProps extends CursorPreset {
  /** A preset name or object. Other props are merged over it. */
  preset?: keyof typeof presets | CursorPreset
  /** Additional layers or effects rendered inside the cursor. */
  children?: ReactNode
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

export function Cursor({ preset = 'glide', children, ...overrides }: CursorProps): ReactNode {
  const engine = useCursorEngine()
  const isClient = useIsClient()
  const base = typeof preset === 'string' ? presets[preset] : preset
  const color = overrides.color ?? base.color
  const blendMode = overrides.blendMode ?? base.blendMode
  const dot = mergeLayer(base.dot, overrides.dot)
  const ring = mergeLayer(base.ring, overrides.ring)
  const trail = merge(base.trail, overrides.trail)
  const particles = merge(base.particles, overrides.particles)
  const ripple = merge(base.ripple, overrides.ripple)
  const leaderMotion = dot ? dot.motion : undefined

  useEffect(() => {
    engine.setAppearance({ color, blendMode })
  }, [engine, color, blendMode])

  if (!isClient || !engine.root) return null

  return createPortal(
    <>
      {ring && (
        <CursorLayer {...ring}>
          <CursorLabel />
        </CursorLayer>
      )}
      {dot && <CursorLayer {...dot} />}
      {trail && <CursorTrail motion={leaderMotion} {...trail} />}
      {particles && <CursorParticles {...particles} />}
      {ripple && <CursorRipple {...ripple} />}
      {children}
    </>,
    engine.root,
  )
}

function CursorLabel(): ReactNode {
  const { target } = useCursorState()
  return target?.label ? <span style={labelStyle}>{target.label}</span> : null
}

function merge<T extends object>(
  base: T | false | undefined,
  override: T | false | undefined,
): T | false | undefined {
  if (override === undefined) return base
  if (override === false || !base) return override
  return { ...base, ...override }
}

function mergeLayer(
  base: LayerConfig | false | undefined,
  override: LayerConfig | false | undefined,
): LayerConfig | false | undefined {
  const merged = merge(base, override)
  if (!merged || !base || !override) return merged
  return {
    ...merged,
    style: { ...base.style, ...override.style },
    states: { ...base.states, ...override.states },
  }
}
