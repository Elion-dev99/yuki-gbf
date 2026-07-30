import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { migrateProfile } from '../lib/gameLogic'
import './Layout.css'

const NAV = [
  { path: '/home', label: 'マイページ', icon: 'home' },
  { path: '/quests', label: 'クエスト', icon: 'quest' },
  { path: '/party', label: '編成', icon: 'party' },
  { path: '/summon', label: 'ガチャ', icon: 'summon' },
  { path: '/characters', label: 'リスト', icon: 'list' },
]

function NavIcon({ type }: { type: string }) {
  return <i className={`gicon gicon-${type}`} aria-hidden />
}

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="boot-screen">
        <div className="boot-ring" />
        <p>Now Loading...</p>
      </div>
    )
  }
  if (!user) return <Navigate to="/" replace />
  return <Outlet />
}

export function AppShell() {
  const { profile, logout, firebaseReady, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const p = profile ? migrateProfile(profile) : null
  const hideChrome = location.pathname.startsWith('/battle/')

  return (
    <div className={`shell gbf-shell ${hideChrome ? 'battle-mode' : ''}`}>
      {!hideChrome && (
        <header className="gbf-topbar">
          <button type="button" className="gbf-rank" onClick={() => navigate('/home')}>
            <span className="rank-ring">
              <span className="rank-label">RANK</span>
              <strong>{p?.rank ?? 1}</strong>
            </span>
          </button>

          <div className="gbf-gauges">
            <div className="gauge ap">
              <span className="g-label">AP</span>
              <div className="g-track">
                <div className="g-fill" style={{ width: `${p ? (p.ap / p.maxAp) * 100 : 0}%` }} />
              </div>
              <span className="g-val">
                {p?.ap ?? 0}/{p?.maxAp ?? 75}
              </span>
            </div>
            <div className="gauge bp">
              <span className="g-label">EP</span>
              <div className="g-track">
                <div className="g-fill" style={{ width: `${p ? (p.bp / p.maxBp) * 100 : 0}%` }} />
              </div>
              <span className="g-val">
                {p?.bp ?? 0}/{p?.maxBp ?? 5}
              </span>
            </div>
          </div>

          <div className="gbf-currency">
            <span className="rupie">
              <i className="coin" />
              {p?.rupies ?? 0}
            </span>
            <span className="crystal">
              <i className="gem" />
              {p?.crystals ?? 0}
            </span>
          </div>

          <button
            type="button"
            className="gbf-icon-btn"
            title="AP/EP全回復"
            onClick={async () => {
              if (p) await updateProfile(migrateProfile({ ...p, ap: p.maxAp, bp: p.maxBp }))
            }}
          >
            ＋
          </button>
          <button
            type="button"
            className="gbf-icon-btn logout"
            title="ログアウト"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            ×
          </button>
        </header>
      )}

      {!firebaseReady && !hideChrome && (
        <div className="demo-banner">デモモード（ローカル保存）</div>
      )}

      <main className={`shell-main ${hideChrome ? 'full' : ''}`}>
        <Outlet />
      </main>

      {!hideChrome && (
        <nav className="gbf-bottom-nav" aria-label="メインメニュー">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              <span className="nav-badge">
                <NavIcon type={item.icon} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
