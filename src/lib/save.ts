import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './firebase'
import { createDefaultProfile } from './gameLogic'
import type { PlayerProfile } from '../types/game'

const LOCAL_KEY = 'azure-fantasia-save'
const LOCAL_UID_KEY = 'azure-fantasia-uid'

export function getLocalUid(): string {
  let uid = localStorage.getItem(LOCAL_UID_KEY)
  if (!uid) {
    uid = `local-${crypto.randomUUID()}`
    localStorage.setItem(LOCAL_UID_KEY, uid)
  }
  return uid
}

export async function loadProfile(uid: string): Promise<PlayerProfile | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, 'players', uid))
    if (snap.exists()) return snap.data() as PlayerProfile
    return null
  }
  const raw = localStorage.getItem(`${LOCAL_KEY}:${uid}`)
  if (!raw) return null
  return JSON.parse(raw) as PlayerProfile
}

export async function saveProfile(uid: string, profile: PlayerProfile): Promise<void> {
  const payload = { ...profile, updatedAt: Date.now() }
  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, 'players', uid), payload, { merge: true })
    return
  }
  localStorage.setItem(`${LOCAL_KEY}:${uid}`, JSON.stringify(payload))
}

export async function ensureProfile(user: User, displayName?: string): Promise<PlayerProfile> {
  const existing = await loadProfile(user.uid)
  if (existing) return existing
  const name = displayName || user.displayName || '騎空士'
  const profile = createDefaultProfile(name)
  await saveProfile(user.uid, profile)
  return profile
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback)
  }
  // Local demo mode: restore guest session if present
  const guest = localStorage.getItem('azure-fantasia-guest')
  if (guest === '1') {
    queueMicrotask(() =>
      callback({
        uid: getLocalUid(),
        displayName: 'ゲスト騎空士',
        email: null,
        isAnonymous: true,
      } as User),
    )
  } else {
    queueMicrotask(() => callback(null))
  }
  return () => {}
}

export async function registerEmail(email: string, password: string, displayName: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase未設定です。ゲストで遊ぶか、.env を設定してください。')
  }
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  await ensureProfile(cred.user, displayName)
  return cred.user
}

export async function loginEmail(email: string, password: string) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase未設定です。ゲストで遊ぶか、.env を設定してください。')
  }
  const cred = await signInWithEmailAndPassword(auth, email, password)
  await ensureProfile(cred.user)
  return cred.user
}

export async function loginGuest() {
  if (isFirebaseConfigured && auth) {
    const cred = await signInAnonymously(auth)
    await ensureProfile(cred.user, 'ゲスト騎空士')
    return cred.user
  }
  localStorage.setItem('azure-fantasia-guest', '1')
  const fake = {
    uid: getLocalUid(),
    displayName: 'ゲスト騎空士',
    email: null,
    isAnonymous: true,
  } as User
  await ensureProfile(fake, 'ゲスト騎空士')
  return fake
}

export async function logoutUser() {
  if (isFirebaseConfigured && auth) {
    await signOut(auth)
    return
  }
  localStorage.removeItem('azure-fantasia-guest')
}
