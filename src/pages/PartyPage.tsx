import { useMemo, useState } from 'react'
import { CharacterCard } from '../components/CharacterCard'
import { useAuth } from '../context/AuthContext'
import { CHARACTER_MAP } from '../data/characters'
import './PartyPage.css'

export function PartyPage() {
  const { profile, updateProfile } = useAuth()
  const [picking, setPicking] = useState<number | null>(null)

  const ownedDefs = useMemo(() => {
    if (!profile) return []
    return profile.characters
      .map((o) => ({ owned: o, def: CHARACTER_MAP[o.defId] }))
      .filter((x) => x.def)
  }, [profile])

  if (!profile) return null

  async function setSlot(index: number, defId: string | null) {
    const slots = [...profile!.party.slots] as (string | null)[]
    // Remove duplicates
    if (defId) {
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] === defId) slots[i] = null
      }
    }
    slots[index] = defId
    await updateProfile({
      ...profile!,
      party: { slots },
      updatedAt: Date.now(),
    })
    setPicking(null)
  }

  return (
    <div className="party-page">
      <header className="page-header">
        <h1>パーティ編成</h1>
        <p>最大4人。属性相性を意識して編成しよう。</p>
      </header>

      <div className="party-slots">
        {profile.party.slots.map((slot, i) => {
          const def = slot ? CHARACTER_MAP[slot] : null
          const owned = slot ? profile.characters.find((c) => c.defId === slot) : undefined
          return (
            <div key={i} className={`slot ${picking === i ? 'active' : ''}`}>
              <span className="slot-num">#{i + 1}</span>
              {def && owned ? (
                <CharacterCard
                  def={def}
                  owned={owned}
                  compact
                  selected={picking === i}
                  onClick={() => setPicking(picking === i ? null : i)}
                />
              ) : (
                <button type="button" className="empty-slot" onClick={() => setPicking(i)}>
                  空き枠 — タップして選択
                </button>
              )}
              {slot && (
                <button type="button" className="clear-btn" onClick={() => setSlot(i, null)}>
                  外す
                </button>
              )}
            </div>
          )
        })}
      </div>

      {picking !== null && (
        <section className="picker">
          <h2>枠 #{picking + 1} に配置</h2>
          <div className="char-grid">
            {ownedDefs.map(({ def, owned }) => (
              <CharacterCard
                key={def.id}
                def={def}
                owned={owned}
                compact
                selected={profile.party.slots[picking!] === def.id}
                onClick={() => setSlot(picking!, def.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
