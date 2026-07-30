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
    if (p.ap < p.maxAp || p.bp < p.maxBp) {
      void updateProfile(regenAp(p))
    }
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
      <div className="mypage-sky" aria-hidden>
        <div className="sun" />
        <div className="island" />
        <div className="ship" />
        <div className={`lead-portrait ${lead?.element ?? 'light'}`}>
          <span className="hair" />
          <span className="face" />
          <span className="cloak" />
        </div>
      </div>

      <div className="mypage-hud">
        <div className="player-plate">
          <p className="player-name">{p.displayName}</p>
          <p className="player-meta">
            Rank {p.rank}　騎空士　クリア {p.clearedQuests.length}
          </p>
        </div>

        <div className="mypage-actions">
          <button type="button" className="mp-btn quest" onClick={() => navigate('/quests')}>
            <span>クエスト</span>
            <small>{nextQuest ? nextQuest.name : '全ての物語をクリア'}</small>
          </button>
          <button type="button" className="mp-btn party" onClick={() => navigate('/party')}>
            <span>編成</span>
            <small>キャラ / 武器 / 召喚石</small>
          </button>
          <button type="button" className="mp-btn summon" onClick={() => navigate('/summon')}>
            <span>レジェンドガチャ</span>
            <small>結晶で仲間を召喚</small>
          </button>
          <button type="button" className="mp-btn list" onClick={() => navigate('/characters')}>
            <span>キャラリスト</span>
            <small>所持 {p.characters.length}</small>
          </button>
        </div>
      </div>
    </div>
  )
}
