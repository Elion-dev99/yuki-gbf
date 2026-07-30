import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CHARACTER_MAP } from '../data/characters'
import { SUMMON_MAP } from '../data/equipment'
import { QUEST_MAP } from '../data/quests'
import {
  applyQuestRewards,
  callSummon,
  pressAttack,
  runEnemyTurn,
  selectAlly,
  selectEnemy,
  startBattle,
  toggleAbility,
} from '../lib/gameLogic'
import type { BattleState } from '../types/game'
import { CHARGE_MAX, ELEMENT_LABEL } from '../types/game'
import './BattlePage.css'

export function BattlePage() {
  const { questId } = useParams()
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const quest = questId ? QUEST_MAP[questId] : undefined
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [error, setError] = useState('')
  const [rewardApplied, setRewardApplied] = useState(false)
  const [flash, setFlash] = useState(false)
  const [showAbil, setShowAbil] = useState(false)

  useEffect(() => {
    if (!profile || !quest) return
    try {
      setBattle(startBattle(quest, profile))
      setRewardApplied(false)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'バトル開始に失敗')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questId])

  const phase = battle?.phase
  const turn = battle?.turn

  useEffect(() => {
    if (phase !== 'enemy') return
    const t = window.setTimeout(() => {
      setFlash(true)
      setBattle((prev) => (prev ? runEnemyTurn(prev) : prev))
      window.setTimeout(() => setFlash(false), 280)
    }, 700)
    return () => window.clearTimeout(t)
  }, [phase, turn])

  useEffect(() => {
    async function give() {
      if (!battle || !profile || !quest || battle.phase !== 'won' || rewardApplied) return
      await updateProfile(applyQuestRewards(profile, quest))
      setRewardApplied(true)
    }
    void give()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.phase])

  const selected = battle?.allies[battle.selectedAlly]
  const skills = useMemo(() => {
    if (!selected) return []
    return CHARACTER_MAP[selected.defId]?.skills ?? []
  }, [selected])
  const summon = battle?.mainSummonId ? SUMMON_MAP[battle.mainSummonId] : null

  if (error) {
    return (
      <div className="gbf-battle">
        <p className="center-msg">{error}</p>
        <Link to="/party">編成へ</Link>
      </div>
    )
  }
  if (!quest || !battle) {
    return (
      <div className="gbf-battle">
        <p className="center-msg">Ready...</p>
      </div>
    )
  }

  function act(fn: () => BattleState) {
    setFlash(true)
    window.setTimeout(() => setFlash(false), 220)
    setBattle(fn())
  }

  return (
    <div className={`gbf-battle ${flash ? 'flash' : ''}`}>
      <div className="bb-bg" aria-hidden />

      <header className="bb-top">
        <button type="button" className="bb-retreat" onClick={() => navigate('/quests')}>
          撤退
        </button>
        <div className="bb-title">
          <strong>{quest.name}</strong>
          <span>Turn {battle.turn}</span>
        </div>
        <div className="bb-spacer" />
      </header>

      <section className="bb-enemies">
        {battle.enemies.map((e, i) => (
          <button
            key={e.uid}
            type="button"
            className={`bb-foe ${e.isBoss ? 'boss' : ''} ${e.hp <= 0 ? 'down' : ''} ${battle.selectedEnemy === i ? 'on' : ''}`}
            disabled={e.hp <= 0 || battle.phase !== 'command'}
            onClick={() => setBattle(selectEnemy(battle, i))}
          >
            <div className="bb-foe-art" data-el={e.element}>
              <span className="el">{ELEMENT_LABEL[e.element]}</span>
            </div>
            <div className="bb-foe-hp">
              <div style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
            </div>
            <div className="bb-foe-meta">
              <span>{e.name}</span>
              <span>
                {e.hp}/{e.maxHp}
              </span>
            </div>
          </button>
        ))}
      </section>

      <div className="bb-dock">
        {showAbil && selected && selected.hp > 0 && battle.phase === 'command' && (
          <div className="bb-abils">
            <div className="bb-abils-head">
              <span>{selected.name} のアビリティ</span>
              <button type="button" onClick={() => setShowAbil(false)}>
                ×
              </button>
            </div>
            {skills.map((s) => {
              const cd = selected.skillCds[s.id] ?? 0
              const on = selected.queuedSkillId === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`bb-abil ${on ? 'on' : ''}`}
                  disabled={cd > 0}
                  onClick={() => setBattle(toggleAbility(battle, battle.selectedAlly, s.id))}
                >
                  <strong>{s.name}</strong>
                  <small>{cd > 0 ? `再使用まで ${cd}` : s.description}</small>
                </button>
              )
            })}
          </div>
        )}

        <div className="bb-summons">
          <button
            type="button"
            className="bb-summon-slot"
            disabled={
              battle.phase !== 'command' ||
              battle.summonGauge < 100 ||
              battle.summonUsed ||
              !summon
            }
            onClick={() => act(() => callSummon(battle))}
          >
            <div className="ss-art" data-el={summon?.element ?? 'light'} />
            <div className="ss-gauge">
              <div style={{ width: `${battle.summonGauge}%` }} />
            </div>
            <span>{summon?.name ?? '召喚石なし'}</span>
          </button>
        </div>

        <div className="bb-party-row">
          {battle.allies.map((a, i) => (
            <button
              key={a.uid}
              type="button"
              className={`bb-chara ${a.element} ${a.hp <= 0 ? 'down' : ''} ${battle.selectedAlly === i ? 'sel' : ''} ${a.queuedSkillId ? 'queued' : ''}`}
              disabled={a.hp <= 0}
              onClick={() => {
                setBattle(selectAlly(battle, i))
                setShowAbil(true)
              }}
            >
              <div className="ch-portrait">
                <span className="ch-face" />
                {a.charge >= CHARGE_MAX && <i className="ougi">奥義</i>}
              </div>
              <div className="ch-hp">
                <div style={{ width: `${(a.hp / a.maxHp) * 100}%` }} />
              </div>
              <div className="ch-charge">
                <div style={{ width: `${a.charge}%` }} />
              </div>
              <span className="ch-name">{a.name}</span>
            </button>
          ))}

          {battle.phase === 'command' && (
            <div className="bb-cmd">
              <button type="button" className="bb-btn abil" onClick={() => setShowAbil((v) => !v)}>
                アビリティ
              </button>
              <button
                type="button"
                className="bb-btn attack"
                onClick={() => {
                  setShowAbil(false)
                  act(() => pressAttack(battle))
                }}
              >
                攻撃
              </button>
            </div>
          )}
        </div>

        {battle.phase === 'enemy' && <div className="bb-phase">Enemy Turn</div>}

        {(battle.phase === 'won' || battle.phase === 'lost') && (
          <div className="bb-result">
            <h2>{battle.phase === 'won' ? 'QUEST CLEAR' : 'DEFEAT'}</h2>
            {battle.phase === 'won' && (
              <p>
                ◎{quest.rewards.rupies}　◆{quest.rewards.crystals}　EXP {quest.rewards.exp}
              </p>
            )}
            <button type="button" className="btn primary" onClick={() => navigate('/quests')}>
              OK
            </button>
          </div>
        )}
      </div>

      <div className="bb-log">
        {[...battle.logs].reverse().slice(0, 6).map((l) => (
          <div key={l.id} className={`l-${l.kind}`}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  )
}
