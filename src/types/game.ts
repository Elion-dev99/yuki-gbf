export type Element = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark'
export type CharClass = 'attack' | 'defense' | 'balance' | 'heal' | 'special'
export type Rarity = 'N' | 'R' | 'SR' | 'SSR'
export type WeaponType =
  | 'sword'
  | 'dagger'
  | 'spear'
  | 'axe'
  | 'staff'
  | 'gun'
  | 'melee'
  | 'bow'
  | 'harp'
  | 'katana'

export interface SkillDef {
  id: string
  name: string
  description: string
  power: number
  cooldown: number
  heal?: number
  buffAtk?: number
  buffDef?: number
  /** 奥義ゲージ増加 */
  chargeGain?: number
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

export interface WeaponDef {
  id: string
  name: string
  element: Element
  type: WeaponType
  rarity: Rarity
  atk: number
  hp: number
  skillName: string
  skillBonus: number
}

export interface SummonDef {
  id: string
  name: string
  element: Element
  rarity: Rarity
  atk: number
  hp: number
  callName: string
  callPower: number
  auraName: string
  auraBonus: number
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
  apCost: number
  kind: 'story' | 'free' | 'raid'
}

export interface OwnedCharacter {
  defId: string
  level: number
  exp: number
  obtainedAt: number
}

export interface OwnedWeapon {
  uid: string
  defId: string
  level: number
}

export interface OwnedSummon {
  uid: string
  defId: string
  level: number
}

export interface PartyState {
  /** 前衛4 */
  slots: (string | null)[]
  /** 武器グリッド10（0=メイン） */
  weapons: (string | null)[]
  /** 召喚石 0=メイン + サブ4 */
  summons: (string | null)[]
}

export interface PlayerProfile {
  displayName: string
  rank: number
  exp: number
  rupies: number
  crystals: number
  ap: number
  maxAp: number
  bp: number
  maxBp: number
  characters: OwnedCharacter[]
  weapons: OwnedWeapon[]
  summons: OwnedSummon[]
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
  /** 今ターンにセットしたアビリティ */
  queuedSkillId: string | null
}

export type BattleLogKind =
  | 'attack'
  | 'skill'
  | 'charge'
  | 'heal'
  | 'summon'
  | 'system'
  | 'victory'
  | 'defeat'

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
  /** command=入力待ち / resolve=攻撃演出中扱いはUI / enemy / won / lost */
  phase: 'command' | 'enemy' | 'won' | 'lost'
  logs: BattleLog[]
  selectedAlly: number
  selectedEnemy: number
  /** 召喚ゲージ 0-100 */
  summonGauge: number
  /** メイン召喚石 defId */
  mainSummonId: string | null
  summonUsed: boolean
  /** GMゴッドモード（被ダメ無効・与ダメ極大） */
  godMode?: boolean
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

export const WEAPON_LABEL: Record<WeaponType, string> = {
  sword: '剣',
  dagger: '短剣',
  spear: '槍',
  axe: '斧',
  staff: '杖',
  gun: '銃',
  melee: '格闘',
  bow: '弓',
  harp: '楽器',
  katana: '刀',
}

/** 火>風>土>水>火 / 光⇔闇 */
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

export const MAX_AP = 75
export const MAX_BP = 5
export const CHARGE_MAX = 100
