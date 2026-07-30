import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CHARACTER_MAP } from '../data/characters'
import { QUESTS } from '../data/quests'
import { migrateProfile, regenAp } from '../lib/gameLogic'
import './HomePage.css'

export function HomePage() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!profile) return
    const p = migrateProfile(profile)
    if (p.ap < p.maxAp || p.bp < p.maxBp) void updateProfile(regenAp(p))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) return null
  const p = migrateProfile(profile)
  const leadId = p.party.slots.find(Boolean)
  const lead = leadId ? CHARACTER_MAP[leadId] : null
  const nextQuest = QUESTS.find(
    (q) => q.kind === 'story' && !p.clearedQuests.includes(q.id) && p.rank >= q.unlockRank,
  )

  return (
    <div className="mypage">
      <div className="mypage-world" aria-hidden>
        <div className="sky-grad" />
        <div className="cloud ca" />
        <div className="cloud cb" />
        <div className="cloud cc" />
        <div className="sun" />
        <div className="island far" />
        <div className="island near" />
        <div className="airship" />
        <div className={`hero-char ${lead?.element ?? 'light'}`}>
          <div className="hc-glow" />
          <div className="hc-body">
            <span className="hc-hair" />
            <span className="hc-face" />
            <span className="hc-outfit" />
          </div>
          <div className="hc-nameplate">{lead?.name ?? '騎空士'}</div>
        </div>
      </div>

      <aside className="mypage-side">
        <button type="button" className="side-banner quest" onClick={() => navigate('/quests')}>
          <em>QUEST</em>
          <strong>クエスト</strong>
          <small>{nextQuest ? nextQuest.name : 'クリア済'}</small>
        </button>
        <button type="button" className="side-banner party" onClick={() => navigate('/party')}>
          <em>PARTY</em>
          <strong>編成</strong>
        </button>
        <button type="button" className="side-banner gacha" onClick={() => navigate('/summon')}>
          <em>GACHA</em>
          <strong>ガチャ</strong>
        </button>
      </aside>

      <footer className="mypage-foot">
        <div className="name-plate">
          <span className="np-rank">Rank {p.rank}</span>
          <strong>{p.displayName}</strong>
          <span className="np-meta">騎空士 ID —</span>
        </div>
      </footer>
    </div>
  )
}
