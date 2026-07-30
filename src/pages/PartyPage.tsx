import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CharacterCard } from '../components/CharacterCard'
import { useAuth } from '../context/AuthContext'
import { CHARACTER_MAP } from '../data/characters'
import { SUMMON_MAP, WEAPON_MAP } from '../data/equipment'
import { migrateProfile } from '../lib/gameLogic'
import { ELEMENT_LABEL, WEAPON_LABEL } from '../types/game'
import './PartyPage.css'

type Tab = 'chars' | 'weapons' | 'summons'

export function PartyPage() {
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('chars')
  const [picking, setPicking] = useState<number | null>(null)

  const p = profile ? migrateProfile(profile) : null

  const ownedChars = useMemo(() => {
    if (!p) return []
    return p.characters
      .map((o) => ({ owned: o, def: CHARACTER_MAP[o.defId] }))
      .filter((x) => x.def)
  }, [p])

  if (!p) return null

  async function setCharSlot(index: number, defId: string | null) {
    const slots = [...p!.party.slots] as (string | null)[]
    if (defId) {
      for (let i = 0; i < slots.length; i++) if (slots[i] === defId) slots[i] = null
    }
    slots[index] = defId
    await updateProfile({ ...p!, party: { ...p!.party, slots }, updatedAt: Date.now() })
    setPicking(null)
  }

  async function setWeaponSlot(index: number, wUid: string | null) {
    const weapons = [...p!.party.weapons] as (string | null)[]
    if (wUid) {
      for (let i = 0; i < weapons.length; i++) if (weapons[i] === wUid) weapons[i] = null
    }
    weapons[index] = wUid
    await updateProfile({ ...p!, party: { ...p!.party, weapons }, updatedAt: Date.now() })
    setPicking(null)
  }

  async function setSummonSlot(index: number, sUid: string | null) {
    const summons = [...p!.party.summons] as (string | null)[]
    if (sUid) {
      for (let i = 0; i < summons.length; i++) if (summons[i] === sUid) summons[i] = null
    }
    summons[index] = sUid
    await updateProfile({ ...p!, party: { ...p!.party, summons }, updatedAt: Date.now() })
    setPicking(null)
  }

  return (
    <div className="party-gbf">
      <header className="page-header gbf-ph">
        <h1>編成</h1>
        <button type="button" className="btn azure" onClick={() => navigate('/quests')}>
          クエストへ
        </button>
      </header>

      <div className="tabs">
        {(
          [
            ['chars', 'キャラ'],
            ['weapons', '武器'],
            ['summons', '召喚石'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            onClick={() => {
              setTab(id)
              setPicking(null)
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'chars' && (
        <>
          <div className="front-row">
            {p.party.slots.map((slot, i) => {
              const def = slot ? CHARACTER_MAP[slot] : null
              const owned = slot ? p.characters.find((c) => c.defId === slot) : undefined
              return (
                <div key={i} className={`front-slot ${picking === i ? 'active' : ''}`}>
                  <span className="pos">{i === 0 ? 'リーダー' : `#${i + 1}`}</span>
                  {def && owned ? (
                    <CharacterCard
                      def={def}
                      owned={owned}
                      compact
                      selected={picking === i}
                      onClick={() => setPicking(picking === i ? null : i)}
                    />
                  ) : (
                    <button type="button" className="empty" onClick={() => setPicking(i)}>
                      空き
                    </button>
                  )}
                  {slot && (
                    <button type="button" className="clear" onClick={() => setCharSlot(i, null)}>
                      外す
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          {picking !== null && (
            <div className="picker panel">
              <h2>枠に配置</h2>
              <div className="char-grid">
                {ownedChars.map(({ def, owned }) => (
                  <CharacterCard
                    key={def.id}
                    def={def}
                    owned={owned}
                    compact
                    onClick={() => setCharSlot(picking, def.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'weapons' && (
        <>
          <div className="grid-10">
            {p.party.weapons.map((wUid, i) => {
              const owned = wUid ? p.weapons.find((w) => w.uid === wUid) : undefined
              const def = owned ? WEAPON_MAP[owned.defId] : undefined
              return (
                <button
                  key={i}
                  type="button"
                  className={`eq-slot ${picking === i ? 'active' : ''} ${i === 0 ? 'main' : ''}`}
                  onClick={() => setPicking(picking === i ? null : i)}
                >
                  <span className="eq-pos">{i === 0 ? 'MAIN' : i + 1}</span>
                  {def ? (
                    <>
                      <strong>{def.name}</strong>
                      <small>
                        {ELEMENT_LABEL[def.element]} {WEAPON_LABEL[def.type]} Lv{owned?.level}
                      </small>
                    </>
                  ) : (
                    <span className="empty-t">空き</span>
                  )}
                </button>
              )
            })}
          </div>
          {picking !== null && (
            <div className="picker panel">
              <h2>武器を選択</h2>
              <button type="button" className="clear" onClick={() => setWeaponSlot(picking, null)}>
                外す
              </button>
              <div className="eq-list">
                {p.weapons.map((w) => {
                  const def = WEAPON_MAP[w.defId]
                  if (!def) return null
                  return (
                    <button key={w.uid} type="button" className="eq-row" onClick={() => setWeaponSlot(picking, w.uid)}>
                      <strong>{def.name}</strong>
                      <span>
                        {def.rarity} {ELEMENT_LABEL[def.element]} ATK {def.atk}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'summons' && (
        <>
          <div className="summon-row">
            {p.party.summons.map((sUid, i) => {
              const owned = sUid ? p.summons.find((s) => s.uid === sUid) : undefined
              const def = owned ? SUMMON_MAP[owned.defId] : undefined
              return (
                <button
                  key={i}
                  type="button"
                  className={`eq-slot summon ${picking === i ? 'active' : ''} ${i === 0 ? 'main' : ''}`}
                  onClick={() => setPicking(picking === i ? null : i)}
                >
                  <span className="eq-pos">{i === 0 ? 'MAIN' : `SUB${i}`}</span>
                  {def ? (
                    <>
                      <strong>{def.name}</strong>
                      <small>
                        {ELEMENT_LABEL[def.element]} {def.auraName}
                      </small>
                    </>
                  ) : (
                    <span className="empty-t">空き</span>
                  )}
                </button>
              )
            })}
          </div>
          {picking !== null && (
            <div className="picker panel">
              <h2>召喚石を選択</h2>
              <button type="button" className="clear" onClick={() => setSummonSlot(picking, null)}>
                外す
              </button>
              <div className="eq-list">
                {p.summons.map((s) => {
                  const def = SUMMON_MAP[s.defId]
                  if (!def) return null
                  return (
                    <button key={s.uid} type="button" className="eq-row" onClick={() => setSummonSlot(picking, s.uid)}>
                      <strong>{def.name}</strong>
                      <span>
                        {def.rarity} {ELEMENT_LABEL[def.element]} {def.callName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
