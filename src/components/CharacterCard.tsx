import type { CharacterDef, Element, OwnedCharacter, Rarity } from '../types/game'
import { CLASS_LABEL, ELEMENT_LABEL, RARITY_LABEL } from '../types/game'
import './CharacterCard.css'

const ELEMENT_GLYPH: Record<Element, string> = {
  fire: '炎',
  water: '水',
  earth: '土',
  wind: '風',
  light: '光',
  dark: '闇',
}

interface Props {
  def: CharacterDef
  owned?: OwnedCharacter
  selected?: boolean
  onClick?: () => void
  compact?: boolean
}

export function CharacterCard({ def, owned, selected, onClick, compact }: Props) {
  return (
    <button
      type="button"
      className={`char-card ${def.element} rarity-${def.rarity.toLowerCase()} char-${def.id} ${selected ? 'selected' : ''} ${compact ? 'compact' : ''}`}
      onClick={onClick}
    >
      <div className="char-frame">
        <div className="char-card-art" aria-hidden>
          <div className="portrait">
            <span className="hair" />
            <span className="face" />
            <span className="cloak" />
            <span className="glow" />
          </div>
          <span className="el-seal">{ELEMENT_GLYPH[def.element]}</span>
        </div>
        <div className="char-card-body">
          <div className="char-card-top">
            <span className={`rarity-badge r-${def.rarity.toLowerCase()}`}>
              {RARITY_LABEL[def.rarity as Rarity]}
            </span>
            <span className="el-badge">{ELEMENT_LABEL[def.element]}</span>
          </div>
          <h3>{def.name}</h3>
          {!compact && (
            <>
              <p className="meta">
                {CLASS_LABEL[def.class]}
                {owned ? ` · Lv.${owned.level}` : ''}
              </p>
              <p className="flavor">{def.flavor}</p>
            </>
          )}
          {compact && owned && <p className="meta">Lv.{owned.level}</p>}
        </div>
      </div>
    </button>
  )
}
