import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'
import {
  ensureProfile,
  loginEmail,
  loginGuest,
  logoutUser,
  registerEmail,
  saveProfile,
  subscribeAuth,
} from '../lib/save'
import { isFirebaseConfigured } from '../lib/firebase'
import type { PlayerProfile } from '../types/game'

interface AuthContextValue {
  user: User | null
  profile: PlayerProfile | null
  loading: boolean
  firebaseReady: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  guest: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (next: PlayerProfile) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeAuth(async (u) => {
      setUser(u)
      if (u) {
        try {
          const p = await ensureProfile(u)
          setProfile(p)
        } catch (e) {
          console.error(e)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await loginEmail(email, password)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    await registerEmail(email, password, name)
  }, [])

  const guest = useCallback(async () => {
    const u = await loginGuest()
    if (!isFirebaseConfigured) {
      setUser(u)
      const p = await ensureProfile(u)
      setProfile(p)
    }
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    if (!isFirebaseConfigured) {
      setUser(null)
      setProfile(null)
    }
  }, [])

  const updateProfile = useCallback(
    async (next: PlayerProfile) => {
      if (!user) return
      setProfile(next)
      await saveProfile(user.uid, next)
    },
    [user],
  )

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await ensureProfile(user)
    setProfile(p)
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      firebaseReady: isFirebaseConfigured,
      login,
      register,
      guest,
      logout,
      updateProfile,
      refreshProfile,
    }),
    [user, profile, loading, login, register, guest, logout, updateProfile, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
