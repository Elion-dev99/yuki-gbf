import { useState } from 'react'
import { CharacterCard } from '../components/CharacterCard'
import { useAuth } from '../context/AuthContext'
import { addCharacter, rollSummon, SUMMON_COST, SUMMON_COST_10 } from '../lib/gameLogic'
import type { CharacterDef, PlayerProfile } from '../types/game'
import './SummonPage.css'

export function SummonPage() {
  const { profile, updateProfile } = useAuth()
  const [results, setResults] = useState<CharacterDef[]>([])
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState('')

  if (!profile) return null

  async function pull(count: 1 | 10) {
    const cost = count === 1 ? SUMMON_COST : SUMMON_COST_10
    if (profile!.crystals < cost) {
      setMessage('結晶が足りません')
      return
    }
    setSpinning(true)
    setMessage('')
    await new Promise((r) => setTimeout(r, 600))

    const pulled: CharacterDef[] = []
    for (let i = 0; i < count; i++) pulled.push(rollSummon())

    let next: PlayerProfile = {
      ...profile!,
      crystals: profile!.crystals - cost,
    }
    for (const def of pulled) {
      next = addCharacter(next, def.id)
    }
    // Keep crystal deduction stable across addCharacter clones
    next = { ...next, crystals: profile!.crystals - cost }

    await updateProfile(next)
    setResults(pulled)
    setSpinning(false)
    setMessage(count === 1 ? `${pulled[0].name} を召喚！` : '10連召喚完了！')
  }

  return (
    <div className="summon-page">
      <header className="page-header">
        <h1>召喚</h1>
        <p>結晶を捧げ、空の彼方から仲間を招く。</p>
      </header>

      <div className={`summon-stage ${spinning ? 'spinning' : ''}`}>
        <div className="summon-orb" />
        <p className="summon-cost">
          1回 ◆{SUMMON_COST} / 10連 ◆{SUMMON_COST_10}
        </p>
        <div className="summon-btns">
          <button
            type="button"
            className="btn primary"
            disabled={spinning || profile.crystals < SUMMON_COST}
            onClick={() => pull(1)}
          >
            召喚 ×1
          </button>
          <button
            type="button"
            className="btn secondary"
            disabled={spinning || profile.crystals < SUMMON_COST_10}
            onClick={() => pull(10)}
          >
            召喚 ×10
          </button>
        </div>
        {message && <p className="summon-msg">{message}</p>}
      </div>

      {results.length > 0 && (
        <section className="summon-results">
          <h2>結果</h2>
          <div className="char-grid">
            {results.map((def, i) => (
              <div key={`${def.id}-${i}`} style={{ animationDelay: `${i * 0.06}s` }}>
                <CharacterCard def={def} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rates">
        <h2>排出率（目安）</h2>
        <ul>
          <li>SSR 3% · SR 15% · R 42% · N 40%</li>
          <li>重複時はルピーと経験値に変換</li>
          <li>累計召喚: {profile.totalSummons}</li>
        </ul>
      </section>
    </div>
  )
}
