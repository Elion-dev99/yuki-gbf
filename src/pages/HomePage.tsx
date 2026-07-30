import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { QUESTS } from '../data/quests'
import './HomePage.css'

export function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  if (!profile) return null

  const nextQuest = QUESTS.find((q) => !profile.clearedQuests.includes(q.id) && profile.rank >= q.unlockRank)
  const cleared = profile.clearedQuests.length

  return (
    <div className="home-page">
      <section className="home-hero">
        <p className="kicker">RIDING THE SKY</p>
        <h1>{profile.displayName}</h1>
        <p className="sub">
          Rank {profile.rank} · 所持キャラ {profile.characters.length} · クリア {cleared}/
          {QUESTS.length}
        </p>
      </section>

      <section className="home-actions">
        <button type="button" className="action-tile quest" onClick={() => navigate('/quests')}>
          <span className="tile-label">クエスト</span>
          <span className="tile-desc">
            {nextQuest ? `次: ${nextQuest.name}` : '全ての空域を制覇した'}
          </span>
        </button>
        <button type="button" className="action-tile party" onClick={() => navigate('/party')}>
          <span className="tile-label">編成</span>
          <span className="tile-desc">パーティを整える</span>
        </button>
        <button type="button" className="action-tile summon" onClick={() => navigate('/summon')}>
          <span className="tile-label">召喚</span>
          <span className="tile-desc">結晶で仲間を招く</span>
        </button>
        <button type="button" className="action-tile chars" onClick={() => navigate('/characters')}>
          <span className="tile-label">キャラ</span>
          <span className="tile-desc">図鑑とステータス</span>
        </button>
      </section>

      <section className="home-tip">
        <h2>遊び方</h2>
        <ol>
          <li>編成で最大4人のパーティを組む</li>
          <li>クエストでターン制バトルに挑む</li>
          <li>奥義ゲージを溜めて強力な一撃を放つ</li>
          <li>召喚で新しい騎空士を仲間にする</li>
        </ol>
      </section>
    </div>
  )
}
