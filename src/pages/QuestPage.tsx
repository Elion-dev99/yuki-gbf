import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { QUESTS } from '../data/quests'
import { migrateProfile, spendAp } from '../lib/gameLogic'
import './QuestPage.css'

export function QuestPage() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [err, setErr] = useState('')
  if (!profile) return null
  const p = migrateProfile(profile)
  const partyReady = p.party.slots.some(Boolean)

  async function sortie(questId: string, apCost: number, kind: string) {
    setErr('')
    if (!partyReady) {
      setErr('パーティが空です。編成してください。')
      return
    }
    if (kind === 'raid' && p.bp < 1) {
      setErr('BPが足りません')
      return
    }
    const next = spendAp(p, apCost)
    if (!next) {
      setErr('APが足りません')
      return
    }
    if (kind === 'raid') next.bp = Math.max(0, next.bp - 1)
    await updateProfile(next)
    navigate(`/battle/${questId}`)
  }

  const story = QUESTS.filter((q) => q.kind === 'story' || q.kind === 'raid')
  const free = QUESTS.filter((q) => q.kind === 'free')

  return (
    <div className="quest-gbf">
      <header className="page-header gbf-ph">
        <h1>クエスト</h1>
        <p>
          AP {p.ap}/{p.maxAp}　BP {p.bp}/{p.maxBp}
        </p>
      </header>

      {err && <p className="warn">{err}</p>}
      {!partyReady && <p className="warn">パーティが空です。先に編成してください。</p>}

      <h2 className="sec">メインクエスト</h2>
      <div className="quest-list">
        {story.map((q) => {
          const locked = p.rank < q.unlockRank
          const cleared = p.clearedQuests.includes(q.id)
          return (
            <article
              key={q.id}
              className={`quest-card ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${q.kind}`}
            >
              <div className="quest-meta">
                <span className="chapter">
                  {q.kind === 'raid' ? '討伐戦' : `Chapter ${q.chapter}`}
                </span>
                {cleared && <span className="cleared-badge">CLEAR</span>}
              </div>
              <h3>{q.name}</h3>
              <p>{q.description}</p>
              <div className="rewards">
                消費AP {q.apCost}
                {q.kind === 'raid' ? ' / BP 1' : ''}　報酬 ◎{q.rewards.rupies} ◆{q.rewards.crystals}
              </div>
              <button
                type="button"
                className="btn primary"
                disabled={locked || !partyReady}
                onClick={() => sortie(q.id, q.apCost, q.kind)}
              >
                {locked ? `Rank ${q.unlockRank} で解放` : 'クエスト開始'}
              </button>
            </article>
          )
        })}
      </div>

      <h2 className="sec">フリークエスト</h2>
      <div className="quest-list">
        {free.map((q) => (
          <article key={q.id} className="quest-card">
            <h3>{q.name}</h3>
            <p>{q.description}</p>
            <div className="rewards">
              消費AP {q.apCost}　報酬 EXP {q.rewards.exp}
            </div>
            <button
              type="button"
              className="btn secondary"
              disabled={!partyReady}
              onClick={() => sortie(q.id, q.apCost, q.kind)}
            >
              クエスト開始
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
