import { createContext, useContext, type Context } from 'react'
import type { CursorEngine } from '../core/engine'

export const CursorContext: Context<CursorEngine | null> = createContext<CursorEngine | null>(null)

export function useCursorEngine(): CursorEngine {
  const engine = useContext(CursorContext)
  if (!engine) throw new Error('Cursor hooks and components must be used inside <CursorProvider>.')
  return engine
}
