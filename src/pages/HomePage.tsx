import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CHARACTER_MAP } from '../data/characters'
import { QUESTS } from '../data/quests'
import { CharacterCard } from '../components/CharacterCard'
import './HomePage.css'

export function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  if (!profile) return null

  const nextQuest = QUESTS.find(
    (q) => !profile.clearedQuests.includes(q.id) && profile.rank >= q.unlockRank,
  )
  const cleared = profile.clearedQuests.length
  const partyDefs = profile.party.slots
    .map((id) => {
      if (!id) return null
      const def = CHARACTER_MAP[id]
      const owned = profile.characters.find((c) => c.defId === id)
      return def && owned ? { def, owned } : null
    })
    .filter(Boolean)

  return (
    <div className="home-page">
      <section className="home-hero panel">
        <div className="home-hero-copy">
          <p className="kicker">SKY PORT</p>
          <h1>蒼穹ファンタジア</h1>
          <p className="captain">騎空士 {profile.displayName}</p>
          <p className="sub">
            Rank {profile.rank} · 所持 {profile.characters.length} · クリア {cleared}/{QUESTS.length}
          </p>
          <button type="button" className="btn primary" onClick={() => navigate('/quests')}>
            {nextQuest ? `${nextQuest.name} へ出撃` : 'クエスト一覧へ'}
          </button>
        </div>
        <div className="home-hero-art" aria-hidden>
          <div className="port-island" />
          <div className="port-ship" />
        </div>
      </section>

      <section className="home-actions">
        <button type="button" className="action-tile quest" onClick={() => navigate('/quests')}>
          <span className="tile-icon">⚑</span>
          <span className="tile-label">クエスト</span>
          <span className="tile-desc">
            {nextQuest ? `次: ${nextQuest.name}` : '全ての空域を制覇した'}
          </span>
        </button>
        <button type="button" className="action-tile party" onClick={() => navigate('/party')}>
          <span className="tile-icon">⚔</span>
          <span className="tile-label">編成</span>
          <span className="tile-desc">パーティを整える</span>
        </button>
        <button type="button" className="action-tile summon" onClick={() => navigate('/summon')}>
          <span className="tile-icon">✧</span>
          <span className="tile-label">召喚</span>
          <span className="tile-desc">結晶で仲間を招く</span>
        </button>
        <button type="button" className="action-tile chars" onClick={() => navigate('/characters')}>
          <span className="tile-icon">✦</span>
          <span className="tile-label">キャラ</span>
          <span className="tile-desc">図鑑とステータス</span>
        </button>
      </section>

      {partyDefs.length > 0 && (
        <section className="home-party">
          <h2>現在のパーティ</h2>
          <div className="char-grid">
            {partyDefs.map((p) =>
              p ? <CharacterCard key={p.def.id} def={p.def} owned={p.owned} compact /> : null,
            )}
          </div>
        </section>
      )}
    </div>
  )
}
