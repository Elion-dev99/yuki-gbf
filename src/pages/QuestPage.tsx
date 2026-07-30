import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGm } from '../context/GmContext'
import { QUESTS } from '../data/quests'
import { migrateProfile, spendAp } from '../lib/gameLogic'
import './QuestPage.css'

export function QuestPage() {
  const { profile, updateProfile } = useAuth()
  const { gmEnabled, godMode } = useGm()
  const navigate = useNavigate()
  const [err, setErr] = useState('')
  if (!profile) return null
  const p = migrateProfile(profile)
  const partyReady = p.party.slots.some(Boolean)
  const freeCost = gmEnabled

  async function sortie(questId: string, apCost: number, kind: string) {
    setErr('')
    if (!partyReady) {
      setErr('パーティが空です。編成してください。')
      return
    }
    if (!freeCost && kind === 'raid' && p.bp < 1) {
      setErr('BPが足りません')
      return
    }
    const next = spendAp(p, apCost, { free: freeCost })
    if (!next) {
      setErr('APが足りません')
      return
    }
    if (!freeCost && kind === 'raid') next.bp = Math.max(0, next.bp - 1)
    await updateProfile(next)
    navigate(`/battle/${questId}`)
  }

  const story = QUESTS.filter((q) => q.kind === 'story' || q.kind === 'raid')
  const free = QUESTS.filter((q) => q.kind === 'free')

  return (
    <div className="quest-page ff-page">
      <header className="ff-window page-head">
        <h1>クエスト</h1>
        <p>
          AP {p.ap}/{p.maxAp}　EP {p.bp}/{p.maxBp}
          {freeCost ? '　【GM無料】' : ''}
          {godMode ? '　【GOD】' : ''}
        </p>
      </header>

      {err && <p className="warn ff-window">{err}</p>}
      {!partyReady && <p className="warn ff-window">パーティが空です。先に編成してください。</p>}

      <h2 className="ff-sec">メインクエスト</h2>
      <div className="quest-list">
        {story.map((q) => {
          const locked = !gmEnabled && p.rank < q.unlockRank
          const cleared = p.clearedQuests.includes(q.id)
          return (
            <article
              key={q.id}
              className={`quest-card ff-window ${locked ? 'locked' : ''} ${cleared ? 'cleared' : ''} ${q.kind}`}
            >
              <div className="quest-meta">
                <span className="chapter">
                  {q.kind === 'raid' ? '討伐戦' : `Chapter ${q.chapter}`}
                </span>
                {cleared && <span className="cleared-badge">CLEAR</span>}
              </div>
              <h3>
                <span className="ff-cursor" aria-hidden>
                  ▶
                </span>
                {q.name}
              </h3>
              <p>{q.description}</p>
              <div className="rewards">
                消費AP {freeCost ? 0 : q.apCost}
                {q.kind === 'raid' ? ` / EP ${freeCost ? 0 : 1}` : ''}　報酬 ◎{q.rewards.rupies} ◆
                {q.rewards.crystals}
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

      <h2 className="ff-sec">フリークエスト</h2>
      <div className="quest-list">
        {free.map((q) => (
          <article key={q.id} className="quest-card ff-window">
            <h3>
              <span className="ff-cursor" aria-hidden>
                ▶
              </span>
              {q.name}
            </h3>
            <p>{q.description}</p>
            <div className="rewards">
              消費AP {freeCost ? 0 : q.apCost}　報酬 EXP {q.rewards.exp}
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
