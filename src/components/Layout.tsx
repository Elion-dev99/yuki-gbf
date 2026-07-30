import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const NAV = [
  { path: '/home', label: 'ホーム' },
  { path: '/party', label: '編成' },
  { path: '/characters', label: 'キャラ' },
  { path: '/quests', label: 'クエスト' },
  { path: '/summon', label: '召喚' },
]

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-orb" />
        <p>蒼穹へ接続中…</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

export function AppShell() {
  const { profile, logout, firebaseReady } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => navigate('/home')}>
          <span className="brand-mark">AF</span>
          <span className="brand-name">蒼穹ファンタジア</span>
        </button>
        {profile && (
          <div className="resources">
            <span className="res crystals" title="結晶">
              ◆ {profile.crystals}
            </span>
            <span className="res rupies" title="ルピー">
              ◎ {profile.rupies}
            </span>
            <span className="res rank">Rank {profile.rank}</span>
          </div>
        )}
        <button
          type="button"
          className="logout-btn"
          onClick={async () => {
            await logout()
            navigate('/')
          }}
        >
          ログアウト
        </button>
      </header>

      <nav className="bottom-nav">
        {NAV.map((item) => (
          <button key={item.path} type="button" onClick={() => navigate(item.path)}>
            {item.label}
          </button>
        ))}
      </nav>

      {!firebaseReady && (
        <div className="demo-banner">デモモード（ローカル保存）— Firebase 設定でクラウド同期できます</div>
      )}

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  )
}
