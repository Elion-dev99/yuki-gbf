import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const NAV = [
  { path: '/home', label: 'ホーム', icon: '⌂' },
  { path: '/party', label: '編成', icon: '⚔' },
  { path: '/characters', label: 'キャラ', icon: '✦' },
  { path: '/quests', label: 'クエスト', icon: '⚑' },
  { path: '/summon', label: '召喚', icon: '✧' },
]

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-airship" aria-hidden />
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
          <span className="brand-mark" aria-hidden>
            <span className="brand-wing" />
          </span>
          <span className="brand-text">
            <span className="brand-name">蒼穹ファンタジア</span>
            <span className="brand-sub">AZURE FANTASIA</span>
          </span>
        </button>

        {profile && (
          <div className="resources">
            <span className="res rank">
              <em>RANK</em> {profile.rank}
            </span>
            <span className="res crystals" title="結晶">
              <i className="ico crystal" />
              {profile.crystals}
            </span>
            <span className="res rupies" title="ルピー">
              <i className="ico rupie" />
              {profile.rupies}
            </span>
          </div>
        )}

        <button
          type="button"
          className="logout-btn"
          aria-label="ログアウト"
          onClick={async () => {
            await logout()
            navigate('/')
          }}
        >
          退出
        </button>
      </header>

      {!firebaseReady && (
        <div className="demo-banner">デモモード（ローカル保存）— Firebase 設定でクラウド同期できます</div>
      )}

      <main className="shell-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="メインメニュー">
        {NAV.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="nav-icon" aria-hidden>
              {item.icon}
            </span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
