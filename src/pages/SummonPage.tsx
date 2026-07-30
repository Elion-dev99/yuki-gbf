import { useState } from 'react'
import { CharacterCard } from '../components/CharacterCard'
import { useAuth } from '../context/AuthContext'
import { addCharacter, migrateProfile, rollSummon, SUMMON_COST, SUMMON_COST_10 } from '../lib/gameLogic'
import type { CharacterDef, PlayerProfile } from '../types/game'
import './SummonPage.css'

export function SummonPage() {
  const { profile, updateProfile } = useAuth()
  const [results, setResults] = useState<CharacterDef[]>([])
  const [spinning, setSpinning] = useState(false)
  const [message, setMessage] = useState('')

  if (!profile) return null
  const p = migrateProfile(profile)

  async function pull(count: 1 | 10) {
    const cost = count === 1 ? SUMMON_COST : SUMMON_COST_10
    if (p.crystals < cost) {
      setMessage('結晶が足りません')
      return
    }
    setSpinning(true)
    setMessage('')
    await new Promise((r) => setTimeout(r, 900))

    const pulled: CharacterDef[] = []
    for (let i = 0; i < count; i++) pulled.push(rollSummon())

    let next: PlayerProfile = { ...p, crystals: p.crystals - cost }
    for (const def of pulled) next = addCharacter(next, def.id)
    next = { ...next, crystals: p.crystals - cost }

    await updateProfile(next)
    setResults(pulled)
    setSpinning(false)
    setMessage(count === 1 ? `${pulled[0].rarity} ${pulled[0].name} を獲得！` : '10連召喚完了！')
  }

  return (
    <div className="summon-gbf">
      <header className="page-header gbf-ph">
        <h1>レジェンドガチャ</h1>
        <p>所持結晶 ◆{p.crystals}</p>
      </header>

      <div className={`summon-stage ${spinning ? 'spinning' : ''}`}>
        <div className="banner">
          <p className="banner-title">星晶召喚</p>
          <p className="banner-sub">運命の仲間を呼べ</p>
        </div>
        <div className="summon-orb" />
        <p className="summon-cost">
          1回 ◆{SUMMON_COST}　/　10連 ◆{SUMMON_COST_10}
        </p>
        <div className="summon-btns">
          <button
            type="button"
            className="btn primary"
            disabled={spinning || p.crystals < SUMMON_COST}
            onClick={() => pull(1)}
          >
            召喚する
          </button>
          <button
            type="button"
            className="btn azure"
            disabled={spinning || p.crystals < SUMMON_COST_10}
            onClick={() => pull(10)}
          >
            10連召喚
          </button>
        </div>
        {message && <p className="summon-msg">{message}</p>}
      </div>

      {results.length > 0 && (
        <section className="summon-results">
          <h2>獲得キャラ</h2>
          <div className="char-grid">
            {results.map((def, i) => (
              <CharacterCard key={`${def.id}-${i}`} def={def} compact />
            ))}
          </div>
        </section>
      )}

      <section className="rates panel">
        <h2>提供割合</h2>
        <ul>
          <li>SSR 3%　SR 15%　R 42%　N 40%</li>
          <li>重複時はルピーと経験値に変換</li>
          <li>累計召喚回数: {p.totalSummons}</li>
        </ul>
      </section>
    </div>
  )
}
