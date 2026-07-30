import { CHARACTERS } from '../data/characters'
import { SUMMONS, WEAPONS } from '../data/equipment'
import { QUESTS } from '../data/quests'
import type { PlayerProfile } from '../types/game'
import { MAX_AP, MAX_BP } from '../types/game'
import { migrateProfile } from './gameLogic'

const GM_KEY = 'azure-fantasia-gm'
const GOD_KEY = 'azure-fantasia-god'
/** タイトル画面／GM画面で入力する解放コード */
export const GM_UNLOCK_CODE = 'GM'

export function loadGmEnabled(): boolean {
  return localStorage.getItem(GM_KEY) === '1'
}

export function saveGmEnabled(on: boolean) {
  localStorage.setItem(GM_KEY, on ? '1' : '0')
  if (!on) localStorage.setItem(GOD_KEY, '0')
}

export function loadGodMode(): boolean {
  return localStorage.getItem(GOD_KEY) === '1'
}

export function saveGodMode(on: boolean) {
  localStorage.setItem(GOD_KEY, on ? '1' : '0')
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/** 全キャラ・武器・召喚石を所持、ランク/資源を最大付近に */
export function gmUnlockAll(profile: PlayerProfile): PlayerProfile {
  const next = migrateProfile(profile)
  const now = Date.now()

  for (const c of CHARACTERS) {
    const owned = next.characters.find((x) => x.defId === c.id)
    if (owned) {
      owned.level = 100
      owned.exp = 0
    } else {
      next.characters.push({ defId: c.id, level: 100, exp: 0, obtainedAt: now })
    }
  }

  for (const w of WEAPONS) {
    if (!next.weapons.some((x) => x.defId === w.id)) {
      next.weapons.push({ uid: uid('w'), defId: w.id, level: 20 })
    } else {
      for (const ow of next.weapons) if (ow.defId === w.id) ow.level = 20
    }
  }

  for (const s of SUMMONS) {
    if (!next.summons.some((x) => x.defId === s.id)) {
      next.summons.push({ uid: uid('s'), defId: s.id, level: 20 })
    } else {
      for (const os of next.summons) if (os.defId === s.id) os.level = 20
    }
  }

  // パーティ前衛をSSR寄りで埋める
  const preferred = ['lyra', 'sylph', 'noir', 'kael']
  next.party.slots = preferred.map((id) => id)

  const mainW = next.weapons.find((w) => w.defId === 'w_skyblade') ?? next.weapons[0]
  const mainS = next.summons.find((s) => s.defId === 's_luminiera') ?? next.summons[0]
  if (mainW) next.party.weapons[0] = mainW.uid
  if (mainS) next.party.summons[0] = mainS.uid

  next.rank = Math.max(next.rank, 50)
  next.rupies = 9999999
  next.crystals = 999999
  next.ap = MAX_AP
  next.maxAp = MAX_AP
  next.bp = MAX_BP
  next.maxBp = MAX_BP
  next.clearedQuests = QUESTS.map((q) => q.id)
  next.updatedAt = Date.now()
  return next
}

export function gmRefill(profile: PlayerProfile): PlayerProfile {
  const next = migrateProfile(profile)
  next.rupies = 9999999
  next.crystals = 999999
  next.ap = next.maxAp
  next.bp = next.maxBp
  next.updatedAt = Date.now()
  return next
}

export function gmClearQuests(profile: PlayerProfile): PlayerProfile {
  const next = migrateProfile(profile)
  next.clearedQuests = QUESTS.map((q) => q.id)
  next.updatedAt = Date.now()
  return next
}
