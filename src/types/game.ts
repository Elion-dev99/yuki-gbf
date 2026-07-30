export type Element = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark'

export type CharClass = 'attack' | 'defense' | 'balance' | 'heal' | 'special'

export type Rarity = 'N' | 'R' | 'SR' | 'SSR'

export interface SkillDef {
  id: string
  name: string
  description: string
  power: number
  cooldown: number
  heal?: number
  buffAtk?: number
  buffDef?: number
}

export interface CharacterDef {
  id: string
  name: string
  element: Element
  class: CharClass
  rarity: Rarity
  maxHp: number
  atk: number
  def: number
  skills: SkillDef[]
  chargeName: string
  chargePower: number
  flavor: string
}

export interface EnemyDef {
  id: string
  name: string
  element: Element
  maxHp: number
  atk: number
  def: number
  isBoss?: boolean
}

export interface QuestDef {
  id: string
  name: string
  chapter: number
  description: string
  enemies: string[]
  rewards: { rupies: number; crystals: number; exp: number }
  unlockRank: number
}

export interface OwnedCharacter {
  defId: string
  level: number
  exp: number
  obtainedAt: number
}

export interface PartyState {
  slots: (string | null)[]
}

export interface PlayerProfile {
  displayName: string
  rank: number
  exp: number
  rupies: number
  crystals: number
  characters: OwnedCharacter[]
  party: PartyState
  clearedQuests: string[]
  totalSummons: number
  createdAt: number
  updatedAt: number
}

export interface BattleFighter {
  uid: string
  defId: string
  name: string
  element: Element
  maxHp: number
  hp: number
  atk: number
  def: number
  charge: number
  skillCds: Record<string, number>
  isEnemy: boolean
  isBoss?: boolean
  atkBuff: number
  defBuff: number
}

export type BattleLogKind = 'attack' | 'skill' | 'charge' | 'heal' | 'system' | 'victory' | 'defeat'

export interface BattleLog {
  id: string
  kind: BattleLogKind
  text: string
}

export interface BattleState {
  questId: string
  allies: BattleFighter[]
  enemies: BattleFighter[]
  turn: number
  phase: 'player' | 'enemy' | 'won' | 'lost'
  logs: BattleLog[]
  selectedAlly: number
  rewards?: QuestDef['rewards']
}

export const ELEMENT_LABEL: Record<Element, string> = {
  fire: '火',
  water: '水',
  earth: '土',
  wind: '風',
  light: '光',
  dark: '闇',
}

export const CLASS_LABEL: Record<CharClass, string> = {
  attack: '攻撃',
  defense: '防御',
  balance: 'バランス',
  heal: '回復',
  special: '特殊',
}

export const RARITY_LABEL: Record<Rarity, string> = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR',
}

/** Advantage: fire > wind > earth > water > fire; light <> dark */
export function elementMultiplier(attacker: Element, defender: Element): number {
  const cycle: Record<string, Element> = {
    fire: 'wind',
    wind: 'earth',
    earth: 'water',
    water: 'fire',
  }
  if (cycle[attacker] === defender) return 1.5
  if (cycle[defender] === attacker) return 0.75
  if (
    (attacker === 'light' && defender === 'dark') ||
    (attacker === 'dark' && defender === 'light')
  ) {
    return 1.5
  }
  return 1
}
