import { CHARACTER_MAP, CHARACTERS, STARTER_CHARACTER_IDS } from '../data/characters'
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
import { elementMultiplier } from '../types/game'

let logSeq = 0
function log(kind: BattleLog['kind'], text: string): BattleLog {
  logSeq += 1
  return { id: `log-${logSeq}`, kind, text }
}

function scaleByLevel(base: number, level: number): number {
  return Math.floor(base * (1 + (level - 1) * 0.08))
}

export function createAllyFighter(owned: OwnedCharacter, def: CharacterDef): BattleFighter {
  const cds: Record<string, number> = {}
  for (const s of def.skills) cds[s.id] = 0
  return {
    uid: `ally-${def.id}-${owned.obtainedAt}`,
    defId: def.id,
    name: def.name,
    element: def.element,
    maxHp: scaleByLevel(def.maxHp, owned.level),
    hp: scaleByLevel(def.maxHp, owned.level),
    atk: scaleByLevel(def.atk, owned.level),
    def: scaleByLevel(def.def, owned.level),
    charge: 0,
    skillCds: cds,
    isEnemy: false,
    atkBuff: 0,
    defBuff: 0,
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
  }
}

export function startBattle(quest: QuestDef, profile: PlayerProfile): BattleState {
  const allies: BattleFighter[] = []
  for (const slot of profile.party.slots) {
    if (!slot) continue
    const owned = profile.characters.find((c) => c.defId === slot)
    const def = CHARACTER_MAP[slot]
    if (owned && def) allies.push(createAllyFighter(owned, def))
  }
  if (allies.length === 0) {
    throw new Error('パーティにキャラクターがいません')
  }
  const enemies = quest.enemies.map((id, i) => createEnemyFighter(id, i))
  return {
    questId: quest.id,
    allies,
    enemies,
    turn: 1,
    phase: 'player',
    logs: [log('system', `${quest.name} 開戦！`)],
    selectedAlly: 0,
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
  const raw = (atk * 0.6 + power) * (100 / (100 + def * 0.5))
  const mult = elementMultiplier(element, defender.element)
  const variance = 0.9 + Math.random() * 0.2
  return Math.max(1, Math.floor(raw * mult * variance))
}

function living(fighters: BattleFighter[]): BattleFighter[] {
  return fighters.filter((f) => f.hp > 0)
}

function firstLivingIndex(fighters: BattleFighter[]): number {
  return fighters.findIndex((f) => f.hp > 0)
}

function tickCds(ally: BattleFighter) {
  for (const id of Object.keys(ally.skillCds)) {
    if (ally.skillCds[id] > 0) ally.skillCds[id] -= 1
  }
}

function cloneState(state: BattleState): BattleState {
  return structuredClone(state)
}

function checkEnd(state: BattleState): BattleState {
  if (living(state.enemies).length === 0) {
    state.phase = 'won'
    state.logs.push(log('victory', 'クエストクリア！'))
  } else if (living(state.allies).length === 0) {
    state.phase = 'lost'
    state.logs.push(log('defeat', '全滅してしまった…'))
  }
  return state
}

export function normalAttack(state: BattleState, allyIndex: number, enemyIndex: number): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'player') return next
  const ally = next.allies[allyIndex]
  const enemy = next.enemies[enemyIndex]
  if (!ally || ally.hp <= 0 || !enemy || enemy.hp <= 0) return next

  const dmg = calcDamage(ally, enemy, ally.atk * 0.15, ally.element)
  enemy.hp = Math.max(0, enemy.hp - dmg)
  ally.charge = Math.min(100, ally.charge + 25)
  next.logs.push(log('attack', `${ally.name} の攻撃！ ${enemy.name} に ${dmg} ダメージ`))
  tickCds(ally)
  checkEnd(next)
  if (next.phase === 'player') {
    next.phase = 'enemy'
  }
  return next
}

export function performSkill(
  state: BattleState,
  allyIndex: number,
  skillId: string,
  enemyIndex: number,
): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'player') return next
  const ally = next.allies[allyIndex]
  if (!ally || ally.hp <= 0) return next
  const def = CHARACTER_MAP[ally.defId]
  const skill = def?.skills.find((s) => s.id === skillId) as SkillDef | undefined
  if (!skill) return next
  if ((ally.skillCds[skillId] ?? 0) > 0) return next

  if (skill.heal) {
    for (const a of next.allies) {
      if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + skill.heal)
    }
    next.logs.push(log('heal', `${ally.name} の ${skill.name}！ 味方を回復`))
  }
  if (skill.buffAtk) {
    for (const a of next.allies) {
      if (a.hp > 0) a.atkBuff = Math.min(1, a.atkBuff + skill.buffAtk)
    }
    next.logs.push(log('skill', `${ally.name} の ${skill.name}！ 攻撃力アップ`))
  }
  if (skill.buffDef) {
    for (const a of next.allies) {
      if (a.hp > 0) a.defBuff = Math.min(1, a.defBuff + skill.buffDef)
    }
    next.logs.push(log('skill', `${ally.name} の ${skill.name}！ 防御力アップ`))
  }
  if (skill.power > 0) {
    const enemy = next.enemies[enemyIndex]
    if (enemy && enemy.hp > 0) {
      const dmg = calcDamage(ally, enemy, skill.power, ally.element)
      enemy.hp = Math.max(0, enemy.hp - dmg)
      next.logs.push(
        log('skill', `${ally.name} の ${skill.name}！ ${enemy.name} に ${dmg} ダメージ`),
      )
    }
  }

  ally.skillCds[skillId] = skill.cooldown
  ally.charge = Math.min(100, ally.charge + 15)
  tickCds(ally)
  checkEnd(next)
  if (next.phase === 'player') next.phase = 'enemy'
  return next
}

export function performCharge(state: BattleState, allyIndex: number, enemyIndex: number): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'player') return next
  const ally = next.allies[allyIndex]
  const enemy = next.enemies[enemyIndex]
  if (!ally || ally.hp <= 0 || ally.charge < 100 || !enemy || enemy.hp <= 0) return next
  const def = CHARACTER_MAP[ally.defId]
  const power = def?.chargePower ?? 300
  const name = def?.chargeName ?? '奥義'
  const dmg = calcDamage(ally, enemy, power, ally.element)
  enemy.hp = Math.max(0, enemy.hp - dmg)
  ally.charge = 0
  next.logs.push(log('charge', `${ally.name} 奥義「${name}」！ ${enemy.name} に ${dmg} ダメージ`))

  // Healers' charge also heals a bit
  if (def?.class === 'heal') {
    for (const a of next.allies) {
      if (a.hp > 0) a.hp = Math.min(a.maxHp, a.hp + 600)
    }
    next.logs.push(log('heal', `${ally.name} の奥義で味方を回復`))
  }

  tickCds(ally)
  checkEnd(next)
  if (next.phase === 'player') next.phase = 'enemy'
  return next
}

export function runEnemyTurn(state: BattleState): BattleState {
  const next = cloneState(state)
  if (next.phase !== 'enemy') return next

  for (const enemy of living(next.enemies)) {
    const targets = living(next.allies)
    if (targets.length === 0) break
    const target = targets[Math.floor(Math.random() * targets.length)]
    const dmg = calcDamage(enemy, target, enemy.atk * 0.2, enemy.element)
    target.hp = Math.max(0, target.hp - dmg)
    next.logs.push(log('attack', `${enemy.name} の攻撃！ ${target.name} に ${dmg} ダメージ`))
  }

  checkEnd(next)
  if (next.phase === 'enemy') {
    next.phase = 'player'
    next.turn += 1
    const idx = firstLivingIndex(next.allies)
    if (idx >= 0) next.selectedAlly = idx
    next.logs.push(log('system', `—— ターン ${next.turn} ——`))
  }
  return next
}

export function createDefaultProfile(displayName: string): PlayerProfile {
  const now = Date.now()
  return {
    displayName,
    rank: 1,
    exp: 0,
    rupies: 1000,
    crystals: 300,
    characters: STARTER_CHARACTER_IDS.map((id) => ({
      defId: id,
      level: 1,
      exp: 0,
      obtainedAt: now,
    })),
    party: {
      slots: [STARTER_CHARACTER_IDS[0], STARTER_CHARACTER_IDS[1], STARTER_CHARACTER_IDS[2], null],
    },
    clearedQuests: [],
    totalSummons: 0,
    createdAt: now,
    updatedAt: now,
  }
}

export function applyQuestRewards(profile: PlayerProfile, quest: QuestDef): PlayerProfile {
  const next = structuredClone(profile)
  next.rupies += quest.rewards.rupies
  next.crystals += quest.rewards.crystals
  next.exp += quest.rewards.exp
  while (next.exp >= next.rank * 100) {
    next.exp -= next.rank * 100
    next.rank += 1
  }
  if (!next.clearedQuests.includes(quest.id)) {
    next.clearedQuests.push(quest.id)
  }
  // Level up party chars a bit
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

export const SUMMON_COST = 100
export const SUMMON_COST_10 = 900

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
  const next = structuredClone(profile)
  const existing = next.characters.find((c) => c.defId === defId)
  if (existing) {
    // Duplicate → rupies + small crystal refund feel
    next.rupies += 200
    existing.exp += 30
    while (existing.exp >= existing.level * 50 && existing.level < 100) {
      existing.exp -= existing.level * 50
      existing.level += 1
    }
  } else {
    next.characters.push({
      defId,
      level: 1,
      exp: 0,
      obtainedAt: Date.now(),
    })
  }
  next.totalSummons += 1
  next.updatedAt = Date.now()
  return next
}
