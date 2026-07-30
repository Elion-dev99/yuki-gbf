import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { QUESTS } from '../data/quests'
import './QuestPage.css'

export function QuestPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  if (!profile) return null

  const partyReady = profile.party.slots.some(Boolean)

  return (
    <div className="quest-page">
      <header className="page-header">
        <h1>クエスト</h1>
        <p>空域を巡り、強敵に挑め。</p>
      </header>

      {!partyReady && (
        <p className="warn">パーティが空です。先に編成してください。</p>
      )}

      <div className="quest-list">
        {QUESTS.map((q) => {
          const locked = profile.rank < q.unlockRank
          const cleared = profile.clearedQuests.includes(q.id)
          return (
            <article key={q.id} className={`quest-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''}`}>
              <div className="quest-meta">
                <span className="chapter">Chapter {q.chapter}</span>
                {cleared && <span className="cleared-badge">CLEAR</span>}
              </div>
              <h2>{q.name}</h2>
              <p>{q.description}</p>
              <div className="rewards">
                報酬: ◎{q.rewards.rupies} / ◆{q.rewards.crystals} / EXP {q.rewards.exp}
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={locked || !partyReady}
                onClick={() => navigate(`/battle/${q.id}`)}
              >
                {locked ? `Rank ${q.unlockRank} で解放` : '出撃'}
              </button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
