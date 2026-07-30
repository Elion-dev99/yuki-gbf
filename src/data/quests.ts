import type { EnemyDef, QuestDef } from '../types/game'

export const ENEMIES: EnemyDef[] = [
  { id: 'slime_fire', name: '火スライム', element: 'fire', maxHp: 800, atk: 200, def: 40 },
  { id: 'slime_water', name: '水スライム', element: 'water', maxHp: 800, atk: 200, def: 40 },
  { id: 'goblin', name: 'ゴブリン', element: 'earth', maxHp: 1200, atk: 280, def: 60 },
  { id: 'harpy', name: 'ハーピー', element: 'wind', maxHp: 1100, atk: 300, def: 50 },
  { id: 'shade_imp', name: '影インプ', element: 'dark', maxHp: 1000, atk: 320, def: 45 },
  { id: 'light_sprite', name: '光精', element: 'light', maxHp: 1000, atk: 290, def: 55 },
  { id: 'wyvern', name: 'ワイバーン', element: 'wind', maxHp: 3500, atk: 450, def: 120, isBoss: true },
  { id: 'flame_drake', name: '炎竜', element: 'fire', maxHp: 5000, atk: 580, def: 150, isBoss: true },
  { id: 'abyss_knight', name: '深淵騎士', element: 'dark', maxHp: 6500, atk: 700, def: 200, isBoss: true },
  { id: 'sky_titan', name: '蒼空の巨人', element: 'light', maxHp: 9000, atk: 850, def: 250, isBoss: true },
]

export const ENEMY_MAP = Object.fromEntries(ENEMIES.map((e) => [e.id, e]))

export const QUESTS: QuestDef[] = [
  {
    id: 'q1',
    name: 'はじまりの空島',
    chapter: 1,
    description: '初めてのクエスト。スライムを倒して旅を始めよう。',
    enemies: ['slime_fire', 'slime_water'],
    rewards: { rupies: 500, crystals: 10, exp: 50 },
    unlockRank: 1,
  },
  {
    id: 'q2',
    name: '森の盗賊団',
    chapter: 1,
    description: '森に潜むゴブリンを討伐せよ。',
    enemies: ['goblin', 'goblin', 'harpy'],
    rewards: { rupies: 800, crystals: 15, exp: 80 },
    unlockRank: 1,
  },
  {
    id: 'q3',
    name: '夜の狭間',
    chapter: 2,
    description: '闇の眷属が集う場所。光と闇が交錯する。',
    enemies: ['shade_imp', 'light_sprite', 'shade_imp'],
    rewards: { rupies: 1200, crystals: 25, exp: 120 },
    unlockRank: 2,
  },
  {
    id: 'q4',
    name: '嵐の巣穴',
    chapter: 2,
    description: 'ワイバーンが巣くう崖を攻略する。',
    enemies: ['harpy', 'wyvern'],
    rewards: { rupies: 2000, crystals: 40, exp: 200 },
    unlockRank: 3,
  },
  {
    id: 'q5',
    name: '紅蓮の渓谷',
    chapter: 3,
    description: '炎竜が支配する灼熱の谷。',
    enemies: ['slime_fire', 'goblin', 'flame_drake'],
    rewards: { rupies: 3500, crystals: 60, exp: 350 },
    unlockRank: 4,
  },
  {
    id: 'q6',
    name: '深淵の門',
    chapter: 3,
    description: '闇の騎士が守る禁断の門。',
    enemies: ['shade_imp', 'abyss_knight'],
    rewards: { rupies: 5000, crystals: 80, exp: 500 },
    unlockRank: 5,
  },
  {
    id: 'q7',
    name: '蒼穹の頂',
    chapter: 4,
    description: '空の果てに待つ最終試練。',
    enemies: ['light_sprite', 'wyvern', 'sky_titan'],
    rewards: { rupies: 8000, crystals: 150, exp: 800 },
    unlockRank: 6,
  },
]

export const QUEST_MAP = Object.fromEntries(QUESTS.map((q) => [q.id, q]))
