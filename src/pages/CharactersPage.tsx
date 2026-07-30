import { useMemo, useState } from 'react'
import { CharacterCard } from '../components/CharacterCard'
import { useAuth } from '../context/AuthContext'
import { CHARACTERS } from '../data/characters'
import type { Element } from '../types/game'
import { ELEMENT_LABEL } from '../types/game'
import './CharactersPage.css'

const ELEMENTS: (Element | '')[] = ['', 'fire', 'water', 'earth', 'wind', 'light', 'dark']

export function CharactersPage() {
  const { profile } = useAuth()
  const [element, setElement] = useState<Element | ''>('')
  const [ownedOnly, setOwnedOnly] = useState(true)

  const list = useMemo(() => {
    if (!profile) return []
    const ownedSet = new Set(profile.characters.map((c) => c.defId))
    return CHARACTERS.filter((c) => {
      if (element && c.element !== element) return false
      if (ownedOnly && !ownedSet.has(c.id)) return false
      return true
    }).map((def) => ({
      def,
      owned: profile.characters.find((c) => c.defId === def.id),
    }))
  }, [profile, element, ownedOnly])

  if (!profile) return null

  return (
    <div className="chars-page">
      <header className="page-header gbf-ph">
        <div>
          <h1>キャラリスト</h1>
          <p>
            所持 {profile.characters.length} / {CHARACTERS.length}
          </p>
        </div>
      </header>

      <div className="filters">
        <select value={element} onChange={(e) => setElement(e.target.value as Element | '')}>
          <option value="">属性（全て）</option>
          {ELEMENTS.filter(Boolean).map((el) => (
            <option key={el} value={el}>
              {ELEMENT_LABEL[el as Element]}
            </option>
          ))}
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={ownedOnly}
            onChange={(e) => setOwnedOnly(e.target.checked)}
          />
          所持のみ
        </label>
      </div>

      <div className="char-grid">
        {list.map(({ def, owned }) => (
          <CharacterCard key={def.id} def={def} owned={owned} />
        ))}
      </div>

      {list.length === 0 && <p className="empty">該当するキャラがいません</p>}
    </div>
  )
}
