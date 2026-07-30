import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadGmEnabled, loadGodMode, saveGmEnabled, saveGodMode } from '../lib/gm'

interface GmContextValue {
  gmEnabled: boolean
  godMode: boolean
  setGmEnabled: (on: boolean) => void
  setGodMode: (on: boolean) => void
}

const GmContext = createContext<GmContextValue | null>(null)

export function GmProvider({ children }: { children: ReactNode }) {
  const [gmEnabled, setGmEnabledState] = useState(() => loadGmEnabled())
  const [godMode, setGodModeState] = useState(() => loadGmEnabled() && loadGodMode())

  const setGmEnabled = useCallback((on: boolean) => {
    saveGmEnabled(on)
    setGmEnabledState(on)
    if (!on) {
      saveGodMode(false)
      setGodModeState(false)
    } else {
      saveGodMode(true)
      setGodModeState(true)
    }
  }, [])

  const setGodMode = useCallback((on: boolean) => {
    saveGodMode(on)
    setGodModeState(on)
  }, [])

  const value = useMemo(
    () => ({ gmEnabled, godMode, setGmEnabled, setGodMode }),
    [gmEnabled, godMode, setGmEnabled, setGodMode],
  )

  return <GmContext.Provider value={value}>{children}</GmContext.Provider>
}

export function useGm() {
  const ctx = useContext(GmContext)
  if (!ctx) throw new Error('useGm must be used within GmProvider')
  return ctx
}
