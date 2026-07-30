import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { migrateProfile } from '../lib/gameLogic'
import './Layout.css'

const NAV = [
  { path: '/home', label: 'マイページ', icon: '🏝' },
  { path: '/quests', label: 'クエスト', icon: '⚔' },
  { path: '/party', label: '編成', icon: '👥' },
  { path: '/summon', label: '召喚', icon: '✦' },
  { path: '/characters', label: 'リスト', icon: '📜' },
]

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-airship" aria-hidden />
        <p>Loading...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

export function AppShell() {
  const { profile, logout, firebaseReady, updateProfile } = useAuth()
  const navigate = useNavigate()
  const p = profile ? migrateProfile(profile) : null

  return (
    <div className="shell gbf-shell">
      <header className="gbf-topbar">
        <button type="button" className="gbf-rank" onClick={() => navigate('/home')}>
          <span className="rank-badge">Rank</span>
          <strong>{p?.rank ?? 1}</strong>
        </button>
        <div className="gbf-gauges">
          <div className="gauge ap">
            <span className="g-label">AP</span>
            <div className="g-track">
              <div
                className="g-fill"
                style={{ width: `${p ? (p.ap / p.maxAp) * 100 : 0}%` }}
              />
            </div>
            <span className="g-val">
              {p?.ap ?? 0}/{p?.maxAp ?? 75}
            </span>
          </div>
          <div className="gauge bp">
            <span className="g-label">BP</span>
            <div className="g-track">
              <div
                className="g-fill"
                style={{ width: `${p ? (p.bp / p.maxBp) * 100 : 0}%` }}
              />
            </div>
            <span className="g-val">
              {p?.bp ?? 0}/{p?.maxBp ?? 5}
            </span>
          </div>
        </div>
        <div className="gbf-currency">
          <span className="rupie">◎ {p?.rupies ?? 0}</span>
          <span className="crystal">◆ {p?.crystals ?? 0}</span>
        </div>
        <button
          type="button"
          className="gbf-menu-btn"
          onClick={async () => {
            if (p) await updateProfile(migrateProfile({ ...p, ap: p.maxAp, bp: p.maxBp }))
          }}
          title="AP/BP回復（デモ）"
        >
          回復
        </button>
        <button
          type="button"
          className="gbf-menu-btn logout"
          onClick={async () => {
            await logout()
            navigate('/')
          }}
        >
          退出
        </button>
      </header>

      {!firebaseReady && <div className="demo-banner">デモモード（ローカル保存）</div>}

      <main className="shell-main">
        <Outlet />
      </main>

      <nav className="gbf-bottom-nav" aria-label="メインメニュー">
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
