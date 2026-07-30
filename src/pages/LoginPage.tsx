import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export function LoginPage() {
  const { user, loading, login, register, guest, firebaseReady } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  if (!loading && user) return <Navigate to="/home" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, name || '騎空士')
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  async function onGuest() {
    setError('')
    setBusy(true)
    try {
      await guest()
    } catch (err) {
      setError(err instanceof Error ? err.message : '開始に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="title-screen">
      <div className="ts-world" aria-hidden>
        <div className="ts-sky" />
        <div className="ts-sun" />
        <div className="ts-island a" />
        <div className="ts-island b" />
        <div className="ts-ship" />
      </div>

      <div className="ts-logo">
        <p className="ts-sub">GRANBLUE-LIKE SKY RPG</p>
        <h1>蒼穹ファンタジア</h1>
        <p className="ts-tag">空の彼方へ、戦いの旅が始まる</p>
      </div>

      <div className="ts-actions">
        <button type="button" className="ts-start" disabled={busy} onClick={onGuest}>
          START
        </button>
        <button type="button" className="ts-account" disabled={busy} onClick={() => setShowAuth((v) => !v)}>
          アカウント連携
        </button>
        {error && !showAuth && <p className="ts-error">{error}</p>}
      </div>

      {showAuth && (
        <section className="ts-panel">
          <div className="ts-tabs">
            <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
              ログイン
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'on' : ''}
              onClick={() => setMode('register')}
            >
              新規登録
            </button>
          </div>
          {!firebaseReady && <p className="ts-hint">Firebase未設定のためゲスト推奨</p>}
          <form onSubmit={onSubmit} className="ts-form">
            {mode === 'register' && (
              <label>
                騎空士名
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label>
              メール
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={firebaseReady} />
            </label>
            <label>
              パスワード
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={firebaseReady}
                minLength={6}
              />
            </label>
            {error && <p className="ts-error">{error}</p>}
            <button type="submit" className="btn azure" disabled={busy || !firebaseReady}>
              {mode === 'login' ? 'ログイン' : '登録'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
