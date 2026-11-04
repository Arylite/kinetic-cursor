import { useEffect, useState, type ReactNode } from 'react'
import { CursorEngine, type EngineOptions } from '../core/engine'
import { CursorContext } from './context'

export interface CursorProviderProps extends EngineOptions {
  children?: ReactNode
}

export function CursorProvider({ children, ...options }: CursorProviderProps): ReactNode {
  const [engine] = useState(() => new CursorEngine(options))

  useEffect(() => {
    engine.configure(options)
  })

  useEffect(() => {
    engine.connect()
    return () => {
      engine.disconnect()
    }
  }, [engine])

  return <CursorContext.Provider value={engine}>{children}</CursorContext.Provider>
}
