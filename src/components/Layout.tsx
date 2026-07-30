import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGm } from '../context/GmContext'
import { migrateProfile } from '../lib/gameLogic'
import './Layout.css'

const NAV = [
  { path: '/home', label: 'ホーム', icon: 'home' },
  { path: '/quests', label: 'クエスト', icon: 'quest' },
  { path: '/party', label: 'パーティ', icon: 'party' },
  { path: '/summon', label: '召喚', icon: 'summon' },
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
  const { gmEnabled } = useGm()
  const navigate = useNavigate()
  const location = useLocation()
  const p = profile ? migrateProfile(profile) : null
  const hideChrome = location.pathname.startsWith('/battle/')
  const navItems = gmEnabled
    ? [...NAV.slice(0, 4), { path: '/gm', label: 'GM', icon: 'gm' }, NAV[4]]
    : NAV

  return (
    <div className={`shell ff-shell ${hideChrome ? 'battle-mode' : ''}`}>
      {!hideChrome && (
        <header className="ff-topbar">
          <button type="button" className="ff-rank" onClick={() => navigate('/home')}>
            <span className="rank-ring">
              <span className="rank-label">LV</span>
              <strong>{p?.rank ?? 1}</strong>
            </span>
          </button>

          <div className="ff-gauges">
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

          <div className="ff-currency">
            <span className="rupie">
              <i className="coin" />
              {p?.rupies ?? 0}
            </span>
            <span className="crystal">
              <i className="gem" />
              {p?.crystals ?? 0}
            </span>
          </div>

          {gmEnabled && (
            <button
              type="button"
              className="ff-icon-btn gm"
              title="GM"
              onClick={() => navigate('/gm')}
            >
              GM
            </button>
          )}
          <button
            type="button"
            className="ff-icon-btn"
            title="AP/EP全回復"
            onClick={async () => {
              if (p) await updateProfile(migrateProfile({ ...p, ap: p.maxAp, bp: p.maxBp }))
            }}
          >
            ＋
          </button>
          <button
            type="button"
            className="ff-icon-btn logout"
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
      {gmEnabled && !hideChrome && <div className="gm-banner">GM MODE</div>}

      <main className={`shell-main ${hideChrome ? 'full' : ''}`}>
        <Outlet />
      </main>

      {!hideChrome && (
        <nav
          className={`ff-bottom-nav ${gmEnabled ? 'with-gm' : ''}`}
          aria-label="メインメニュー"
        >
          {navItems.map((item) => (
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
