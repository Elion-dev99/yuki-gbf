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
      setError(err instanceof Error ? err.message : 'ゲスト開始に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="sky-layer" aria-hidden>
        <div className="sun" />
        <div className="island island-a" />
        <div className="island island-b" />
        <div className="airship" />
        <div className="cloud c1" />
        <div className="cloud c2" />
        <div className="cloud c3" />
      </div>

      <div className="login-hero">
        <h1 className="login-brand">蒼穹ファンタジア</h1>
        <p className="login-tagline">空の彼方へ、仲間と共に挑むターン制RPG</p>
        <div className="login-cta-row">
          <button type="button" className="btn primary" disabled={busy} onClick={onGuest}>
            ゲストではじめる
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            onClick={() => setShowAuth((v) => !v)}
          >
            アカウント
          </button>
        </div>
        {error && !showAuth && <p className="error hero-error">{error}</p>}
      </div>

      {showAuth && (
        <section className="login-panel panel">
          <div className="mode-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              ログイン
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              新規登録
            </button>
          </div>

          {!firebaseReady && (
            <p className="hint">
              Firebase 未設定のためアカウント機能はデモです。ゲストプレイはローカルに保存されます。
            </p>
          )}

          <form onSubmit={onSubmit} className="login-form">
            {mode === 'register' && (
              <label>
                騎空士名
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ライラ" />
              </label>
            )}
            <label>
              メール
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={firebaseReady}
                placeholder="you@example.com"
              />
            </label>
            <label>
              パスワード
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={firebaseReady}
                minLength={6}
                placeholder="6文字以上"
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn azure" disabled={busy || !firebaseReady}>
              {mode === 'login' ? 'ログイン' : 'アカウント作成'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
