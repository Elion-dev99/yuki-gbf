import { CHARACTER_MAP, CHARACTERS, STARTER_CHARACTER_IDS } from '../data/characters'
import { SUMMON_MAP, WEAPON_MAP } from '../data/equipment'
import { ENEMY_MAP } from '../data/quests'
import type {
  BattleFighter,
  BattleLog,
  BattleState,
  CharacterDef,
  Element,
  OwnedCharacter,
  PlayerProfile,
  QuestDef,
  SkillDef,
} from '../types/game'
import { CHARGE_MAX, MAX_AP, MAX_BP, elementMultiplier } from '../types/game'

let logSeq = 0
function log(kind: BattleLog['kind'], text: string): BattleLog {
  logSeq += 1
  return { id: `log-${logSeq}`, kind, text }
}

function scaleByLevel(base: number, level: number): number {
  return Math.floor(base * (1 + (level - 1) * 0.08))
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function createAllyFighter(
  owned: OwnedCharacter,
  def: CharacterDef,
  gridBonus: { atk: number; hp: number },
): BattleFighter {
  const cds: Record<string, number> = {}
  for (const s of def.skills) cds[s.id] = 0
  const maxHp = scaleByLevel(def.maxHp, owned.level) + gridBonus.hp
  const atk = scaleByLevel(def.atk, owned.level) + gridBonus.atk
  return {
    uid: `ally-${def.id}-${owned.obtainedAt}`,
    defId: def.id,
    name: def.name,
    element: def.element,
    maxHp,
    hp: maxHp,
    atk,
    def: scaleByLevel(def.def, owned.level),
    charge: 0,
    skillCds: cds,
    isEnemy: false,
    atkBuff: 0,
    defBuff: 0,
    queuedSkillId: null,
  }
}

export function createEnemyFighter(enemyId: string, index: number): BattleFighter {
  const e = ENEMY_MAP[enemyId]
  if (!e) throw new Error(`Unknown enemy: ${enemyId}`)
  return {
    uid: `enemy-${enemyId}-${index}`,
    defId: enemyId,
    name: e.name,
    element: e.element,
    maxHp: e.maxHp,
    hp: e.maxHp,
    atk: e.atk,
    def: e.def,
    charge: 0,
    skillCds: {},
    isEnemy: true,
    isBoss: e.isBoss,
    atkBuff: 0,
    defBuff: 0,
    queuedSkillId: null,
  }
}

/** 武器グリッド＋召喚石オーラから補正を算出 */
export function calcGridBonus(profile: PlayerProfile): {
  atk: number
  hp: number
  auraByElement: Partial<Record<Element, number>>
  mainSummonId: string | null
} {
  let atk = 0
  let hp = 0
  const auraByElement: Partial<Record<Element, number>> = {}

  for (const wUid of profile.party.weapons) {
    if (!wUid) continue
    const owned = profile.weapons.find((w) => w.uid === wUid)
    const def = owned ? WEAPON_MAP[owned.defId] : undefined
    if (!def) continue
    const lv = owned?.level ?? 1
    atk += Math.floor(def.atk * (1 + (lv - 1) * 0.05) * (1 + def.skillBonus))
    hp += Math.floor(def.hp * (1 + (lv - 1) * 0.05))
  }

  let mainSummonId: string | null = null
  for (let i = 0; i < profile.party.summons.length; i++) {
    const sUid = profile.party.summons[i]
    if (!sUid) continue
    const owned = profile.summons.find((s) => s.uid === sUid)
    const def = owned ? SUMMON_MAP[owned.defId] : undefined
    if (!def) continue
    atk += Math.floor(def.atk * 0.15)
    hp += Math.floor(def.hp * 0.15)
    auraByElement[def.element] = Math.max(auraByElement[def.element] ?? 0, def.auraBonus)
    if (i === 0) mainSummonId = def.id
  }

  return { atk: Math.floor(atk / 4), hp: Math.floor(hp / 4), auraByElement, mainSummonId }
}

export function startBattle(quest: QuestDef, profile: PlayerProfile): BattleState {
  const grid = calcGridBonus(profile)
  const allies: BattleFighter[] = []
  for (const slot of profile.party.slots) {
    if (!slot) continue
    const owned = profile.characters.find((c) => c.defId === slot)
    const def = CHARACTER_MAP[slot]
    if (owned && def) {
      const fighter = createAllyFighter(owned, def, { atk: grid.atk, hp: grid.hp })
      const aura = grid.auraByElement[def.element] ?? 0
      fighter.atkBuff += aura
      allies.push(fighter)
    }
  }
  if (allies.length === 0) throw new Error('パーティにキャラクターがいません')
  const enemies = quest.enemies.map((id, i) => createEnemyFighter(id, i))
  return {
    questId: quest.id,
    allies,
    enemies,
    turn: 1,
    phase: 'command',
    logs: [log('system', `${quest.name} —— バトルスタート！`)],
    selectedAlly: 0,
    selectedEnemy: 0,
    summonGauge: 100,
    mainSummonId: grid.mainSummonId,
    summonUsed: false,
  }
}

function calcDamage(
  attacker: BattleFighter,
  defender: BattleFighter,
  power: number,
  element: Element,
): number {
  const atk = attacker.atk * (1 + attacker.atkBuff)
  const def = Math.max(1, defender.def * (1 + defender.defBuff))
  const raw = (atk * 0.55 + power) * (100 / (100 + def * 0.45))
  const mult = elementMultiplier(element, defender.element)
  const variance = 0.9 + Math.random() * 0.2
  return Math.max(1, Math.floor(raw * mult * variance))
}

function living(fighters: BattleFighter[]) {
  return fighters.filter((f) => f.hp > 0)
}

function firstLivingEnemy(state: BattleState): number {
  const i = state.enemies.findIndex((e) => e.hp > 0)
  return i < 0 ? 0 : i
}

function cloneState(state: BattleState): BattleState {
  return structuredClone(state)
}

function checkEnd(state: BattleState): BattleState {
  if (living(state.enemies).length === 0) {
    state.phase = 'won'
    state.logs.push(log('victory', 'バトルクリア！'))
  } else if (living(state.allies).length === 0) {
    state.phase = 'lost'
    state.logs.push(log('defeat', '全滅してしまった…'))
  }
  return state
}

function applySkillEffects(
  state: BattleState,
  ally: BattleFighter,
  skill: SkillDef,
  enemyIndex: number,
) {
  if (skill.heal) {
    for (const a of state.allies) {
      if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + skill.heal)
    }
    state.logs.push(log('heal', `${ally.name} のアビリティ「${skill.name}」！ 回復`))
  }
  if (skill.buffAtk) {
    for (const a of state.allies) {
      if (a.hp > 0) a.atkBuff = Math.min(1.5, a.atkBuff + skill.buffAtk)
    }
    state.logs.push(log('skill', `${ally.name}「${skill.name}」！ 攻撃力UP`))
  }
  if (skill.buffDef) {
    for (const a of state.allies) {
      if (a.hp > 0) a.defBuff = Math.min(1.5, a.defBuff + skill.buffDef)
    }
    state.logs.push(log('skill', `${ally.name}「${skill.name}」！ 防御力UP`))
  }
  if (skill.power > 0) {
    let ei = enemyIndex
    if (!state.enemies[ei] || state.enemies[ei].hp <= 0) ei = firstLivingEnemy(state)
    const enemy = state.enemies[ei]
    if (enemy && enemy.hp > 0) {
      const dmg = calcDamage(ally, enemy, skill.power, ally.element)
      enemy.hp = Math.max(0, enemy.hp - dmg)
      state.logs.push(log('skill', `${ally.name}「${skill.name}」！ ${enemy.name} に ${dmg}`))
    }
  }
  if (skill.chargeGain) {
    ally.charge = Math.min(CHARGE_MAX, ally.charge + skill.chargeGain)
  }
  ally.skillCds[skill.id] = skill.cooldown
}

/** アビリティをセット／解除（攻撃前に予約） */
export function toggleAbility(state: BattleState, allyIndex: number, skillId: string): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'command') return next
  const ally = next.allies[allyIndex]
  if (!ally || ally.hp <= 0) return next
  if ((ally.skillCds[skillId] ?? 0) > 0) return next
  ally.queuedSkillId = ally.queuedSkillId === skillId ? null : skillId
  next.selectedAlly = allyIndex
  return next
}

export function selectEnemy(state: BattleState, enemyIndex: number): BattleState {
  const next = cloneState(state)
  if (next.enemies[enemyIndex]?.hp > 0) next.selectedEnemy = enemyIndex
  return next
}

export function selectAlly(state: BattleState, allyIndex: number): BattleState {
  const next = cloneState(state)
  if (next.allies[allyIndex]?.hp > 0) next.selectedAlly = allyIndex
  return next
}

/** グラブル式：攻撃ボタンでアビ→通常/奥義を全員分解決 */
export function pressAttack(state: BattleState): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'command') return next

  let target = next.selectedEnemy
  if (!next.enemies[target] || next.enemies[target].hp <= 0) {
    target = firstLivingEnemy(next)
    next.selectedEnemy = target
  }

  // 1) 予約アビリティ
  for (const ally of next.allies) {
    if (ally.hp <= 0 || !ally.queuedSkillId) continue
    const def = CHARACTER_MAP[ally.defId]
    const skill = def?.skills.find((s) => s.id === ally.queuedSkillId)
    if (skill) applySkillEffects(next, ally, skill, target)
    ally.queuedSkillId = null
    if (living(next.enemies).length === 0) return checkEnd(next)
  }

  // 2) 各キャラの攻撃 / 奥義
  for (const ally of next.allies) {
    if (ally.hp <= 0) continue
    if (!next.enemies[target] || next.enemies[target].hp <= 0) {
      target = firstLivingEnemy(next)
      next.selectedEnemy = target
    }
    const enemy = next.enemies[target]
    if (!enemy || enemy.hp <= 0) break

    const cdef = CHARACTER_MAP[ally.defId]
    if (ally.charge >= CHARGE_MAX) {
      const power = cdef?.chargePower ?? 300
      const name = cdef?.chargeName ?? '奥義'
      const dmg = calcDamage(ally, enemy, power, ally.element)
      enemy.hp = Math.max(0, enemy.hp - dmg)
      ally.charge = 0
      next.logs.push(log('charge', `${ally.name} 奥義「${name}」！ ${dmg} ダメージ`))
      if (cdef?.class === 'heal') {
        for (const a of next.allies) {
          if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + 700)
        }
        next.logs.push(log('heal', `${ally.name} の奥義で全体回復`))
      }
    } else {
      const dmg = calcDamage(ally, enemy, ally.atk * 0.12, ally.element)
      enemy.hp = Math.max(0, enemy.hp - dmg)
      ally.charge = Math.min(CHARGE_MAX, ally.charge + 20)
      next.logs.push(log('attack', `${ally.name} の攻撃！ ${dmg}`))
    }

    if (living(next.enemies).length === 0) return checkEnd(next)
  }

  checkEnd(next)
  if (next.phase === 'command') {
    next.phase = 'enemy'
    next.summonUsed = false
  }
  return next
}

/** 召喚（ターンに1回、ゲージ100で使用） */
export function callSummon(state: BattleState): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'command' || next.summonUsed || next.summonGauge < 100 || !next.mainSummonId) {
    return next
  }
  const summon = SUMMON_MAP[next.mainSummonId]
  if (!summon) return next

  let target = next.selectedEnemy
  if (!next.enemies[target] || next.enemies[target].hp <= 0) {
    target = firstLivingEnemy(next)
  }
  const enemy = next.enemies[target]
  if (!enemy || enemy.hp <= 0) return next

  const fakeAtk: BattleFighter = {
    uid: 'summon',
    defId: summon.id,
    name: summon.name,
    element: summon.element,
    maxHp: 1,
    hp: 1,
    atk: summon.atk * 0.4,
    def: 0,
    charge: 0,
    skillCds: {},
    isEnemy: false,
    atkBuff: 0,
    defBuff: 0,
    queuedSkillId: null,
  }
  const dmg = calcDamage(fakeAtk, enemy, summon.callPower, summon.element)
  enemy.hp = Math.max(0, enemy.hp - dmg)
  next.summonGauge = 0
  next.summonUsed = true
  next.logs.push(log('summon', `召喚「${summon.name}」${summon.callName}！ ${dmg} ダメージ`))

  // 味方全体に少しチャージ
  for (const a of next.allies) {
    if (a.hp > 0) a.charge = Math.min(CHARGE_MAX, a.charge + 10)
  }

  return checkEnd(next)
}

export function runEnemyTurn(state: BattleState): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'enemy') return next

  for (const enemy of living(next.enemies)) {
    const targets = living(next.allies)
    if (targets.length === 0) break
    const target = targets[Math.floor(Math.random() * targets.length)]
    const dmg = calcDamage(enemy, target, enemy.atk * 0.18, enemy.element)
    target.hp = Math.max(0, target.hp - dmg)
    next.logs.push(log('attack', `${enemy.name} の攻撃！ ${target.name} に ${dmg}`))
  }

  checkEnd(next)
  if (next.phase === 'enemy') {
    next.phase = 'command'
    next.turn += 1
    next.summonGauge = Math.min(100, next.summonGauge + 35)
    // CD tick
    for (const ally of next.allies) {
      for (const id of Object.keys(ally.skillCds)) {
        if (ally.skillCds[id] > 0) ally.skillCds[id] -= 1
      }
      ally.queuedSkillId = null
    }
    const idx = next.allies.findIndex((a) => a.hp > 0)
    if (idx >= 0) next.selectedAlly = idx
    next.logs.push(log('system', `—— Turn ${next.turn} ——`))
  }
  return next
}

export function migrateProfile(raw: PlayerProfile): PlayerProfile {
  const p = structuredClone(raw) as PlayerProfile
  if (typeof p.ap !== 'number') p.ap = MAX_AP
  if (typeof p.maxAp !== 'number') p.maxAp = MAX_AP
  if (typeof p.bp !== 'number') p.bp = MAX_BP
  if (typeof p.maxBp !== 'number') p.maxBp = MAX_BP
  if (!Array.isArray(p.weapons)) p.weapons = []
  if (!Array.isArray(p.summons)) p.summons = []
  if (!p.party) {
    p.party = { slots: [null, null, null, null], weapons: Array(10).fill(null), summons: Array(5).fill(null) }
  }
  if (!Array.isArray(p.party.weapons) || p.party.weapons.length < 10) {
    p.party.weapons = [...(p.party.weapons ?? []), ...Array(10).fill(null)].slice(0, 10)
  }
  if (!Array.isArray(p.party.summons) || p.party.summons.length < 5) {
    p.party.summons = [...(p.party.summons ?? []), ...Array(5).fill(null)].slice(0, 5)
  }
  if (!Array.isArray(p.party.slots) || p.party.slots.length < 4) {
    p.party.slots = [...(p.party.slots ?? []), ...Array(4).fill(null)].slice(0, 4)
  }

  // 初期装備が空なら付与
  if (p.weapons.length === 0) {
    const w = { uid: uid('w'), defId: 'w_starter', level: 1 }
    p.weapons.push(w)
    p.party.weapons[0] = w.uid
  }
  if (p.summons.length === 0) {
    const s = { uid: uid('s'), defId: 's_starter', level: 1 }
    p.summons.push(s)
    p.party.summons[0] = s.uid
  }
  return p
}

export function createDefaultProfile(displayName: string): PlayerProfile {
  const now = Date.now()
  const wMain = { uid: uid('w'), defId: 'w_starter', level: 1 }
  const w2 = { uid: uid('w'), defId: 'w_emberspear', level: 1 }
  const sMain = { uid: uid('s'), defId: 's_starter', level: 1 }
  const s2 = { uid: uid('s'), defId: 's_tiamat', level: 1 }
  const weapons = Array(10).fill(null) as (string | null)[]
  weapons[0] = wMain.uid
  weapons[1] = w2.uid
  const summons = Array(5).fill(null) as (string | null)[]
  summons[0] = sMain.uid
  summons[1] = s2.uid

  return migrateProfile({
    displayName,
    rank: 1,
    exp: 0,
    rupies: 3000,
    crystals: 500,
    ap: MAX_AP,
    maxAp: MAX_AP,
    bp: MAX_BP,
    maxBp: MAX_BP,
    characters: STARTER_CHARACTER_IDS.map((id) => ({
      defId: id,
      level: 1,
      exp: 0,
      obtainedAt: now,
    })),
    weapons: [wMain, w2],
    summons: [sMain, s2],
    party: {
      slots: [STARTER_CHARACTER_IDS[0], STARTER_CHARACTER_IDS[1], STARTER_CHARACTER_IDS[2], STARTER_CHARACTER_IDS[3]],
      weapons,
      summons,
    },
    clearedQuests: [],
    totalSummons: 0,
    createdAt: now,
    updatedAt: now,
  })
}

export function applyQuestRewards(profile: PlayerProfile, quest: QuestDef): PlayerProfile {
  const next = migrateProfile(profile)
  next.rupies += quest.rewards.rupies
  next.crystals += quest.rewards.crystals
  next.exp += quest.rewards.exp
  while (next.exp >= next.rank * 100) {
    next.exp -= next.rank * 100
    next.rank += 1
    next.maxAp = Math.min(99, MAX_AP + Math.floor(next.rank / 5))
  }
  if (!next.clearedQuests.includes(quest.id)) next.clearedQuests.push(quest.id)
  for (const slot of next.party.slots) {
    if (!slot) continue
    const owned = next.characters.find((c) => c.defId === slot)
    if (owned) {
      owned.exp += Math.floor(quest.rewards.exp / 2)
      while (owned.exp >= owned.level * 50 && owned.level < 100) {
        owned.exp -= owned.level * 50
        owned.level += 1
      }
    }
  }
  next.updatedAt = Date.now()
  return next
}

export function spendAp(profile: PlayerProfile, cost: number): PlayerProfile | null {
  const next = migrateProfile(profile)
  if (next.ap < cost) return null
  next.ap -= cost
  next.updatedAt = Date.now()
  return next
}

export function regenAp(profile: PlayerProfile): PlayerProfile {
  const next = migrateProfile(profile)
  // 簡易: ホーム訪問で少し回復
  next.ap = Math.min(next.maxAp, next.ap + 5)
  next.bp = Math.min(next.maxBp, next.bp + 1)
  return next
}

export const SUMMON_COST = 300
export const SUMMON_COST_10 = 3000

const RARITY_WEIGHTS: { rarity: CharacterDef['rarity']; weight: number }[] = [
  { rarity: 'SSR', weight: 3 },
  { rarity: 'SR', weight: 15 },
  { rarity: 'R', weight: 42 },
  { rarity: 'N', weight: 40 },
]

export function rollSummon(): CharacterDef {
  const total = RARITY_WEIGHTS.reduce((s, r) => s + r.weight, 0)
  let roll = Math.random() * total
  let rarity = RARITY_WEIGHTS[RARITY_WEIGHTS.length - 1].rarity
  for (const r of RARITY_WEIGHTS) {
    roll -= r.weight
    if (roll <= 0) {
      rarity = r.rarity
      break
    }
  }
  const pool = CHARACTERS.filter((c) => c.rarity === rarity)
  return pool[Math.floor(Math.random() * pool.length)]
}

export function addCharacter(profile: PlayerProfile, defId: string): PlayerProfile {
  const next = migrateProfile(profile)
  const existing = next.characters.find((c) => c.defId === defId)
  if (existing) {
    next.rupies += 500
    existing.exp += 40
    while (existing.exp >= existing.level * 50 && existing.level < 100) {
      existing.exp -= existing.level * 50
      existing.level += 1
    }
  } else {
    next.characters.push({ defId, level: 1, exp: 0, obtainedAt: Date.now() })
  }
  next.totalSummons += 1
  next.updatedAt = Date.now()
  return next
}
