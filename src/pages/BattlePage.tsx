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
  const [abilOpen, setAbilOpen] = useState(false)

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

  useEffect(() => {
    if (!battle || battle.phase !== 'enemy') return
    const t = window.setTimeout(() => {
      setFlash(true)
      setBattle((prev) => (prev ? runEnemyTurn(prev) : prev))
      window.setTimeout(() => setFlash(false), 280)
    }, 700)
    return () => window.clearTimeout(t)
  }, [battle?.phase, battle?.turn])

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
      <div className="battle-gbf">
        <p className="warn">{error}</p>
        <Link to="/party">編成へ</Link>
      </div>
    )
  }
  if (!quest || !battle) {
    return (
      <div className="battle-gbf">
        <p className="loading">Ready...</p>
      </div>
    )
  }

  function act(fn: () => BattleState) {
    setFlash(true)
    window.setTimeout(() => setFlash(false), 250)
    setBattle(fn())
  }

  return (
    <div className={`battle-gbf ${flash ? 'flash' : ''}`}>
      <header className="btl-head">
        <button type="button" className="retreat" onClick={() => navigate('/quests')}>
          撤退
        </button>
        <div>
          <p className="quest-name">{quest.name}</p>
          <p className="turn">Turn {battle.turn}</p>
        </div>
      </header>

      <section className="btl-stage">
        <div className="enemies">
          {battle.enemies.map((e, i) => (
            <button
              key={e.uid}
              type="button"
              className={`foe ${e.hp <= 0 ? 'down' : ''} ${battle.selectedEnemy === i ? 'targeted' : ''} ${e.isBoss ? 'boss' : ''}`}
              disabled={e.hp <= 0 || battle.phase !== 'command'}
              onClick={() => setBattle(selectEnemy(battle, i))}
            >
              <div className="foe-art" data-el={e.element} />
              <div className="foe-info">
                <span>
                  {e.name}
                  <small> {ELEMENT_LABEL[e.element]}</small>
                </span>
                <div className="bar hp">
                  <div style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                </div>
                <span className="nums">
                  {e.hp}/{e.maxHp}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="btl-party">
        {battle.allies.map((a, i) => (
          <button
            key={a.uid}
            type="button"
            className={`member ${a.element} ${a.hp <= 0 ? 'down' : ''} ${battle.selectedAlly === i ? 'sel' : ''} ${a.queuedSkillId ? 'queued' : ''}`}
            disabled={a.hp <= 0}
            onClick={() => {
              setBattle(selectAlly(battle, i))
              setAbilOpen(true)
            }}
          >
            <div className="mem-art">
              <span className="face" />
            </div>
            <div className="mem-bars">
              <div className="bar hp">
                <div style={{ width: `${(a.hp / a.maxHp) * 100}%` }} />
              </div>
              <div className="bar charge">
                <div style={{ width: `${a.charge}%` }} />
              </div>
            </div>
            <span className="mem-name">{a.name}</span>
            {a.charge >= CHARGE_MAX && <span className="ougi-ready">奥義</span>}
          </button>
        ))}
      </section>

      {battle.phase === 'command' && (
        <section className="btl-command">
          {abilOpen && selected && selected.hp > 0 && (
            <div className="abil-panel">
              <div className="abil-head">
                <strong>{selected.name}</strong>
                <button type="button" onClick={() => setAbilOpen(false)}>
                  ×
                </button>
              </div>
              <div className="abil-list">
                {skills.map((s) => {
                  const cd = selected.skillCds[s.id] ?? 0
                  const queued = selected.queuedSkillId === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`abil ${queued ? 'on' : ''}`}
                      disabled={cd > 0}
                      onClick={() =>
                        setBattle(toggleAbility(battle, battle.selectedAlly, s.id))
                      }
                    >
                      <span>{s.name}</span>
                      <small>{cd > 0 ? `CT${cd}` : s.description}</small>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="cmd-row">
            <button
              type="button"
              className="cmd summon"
              disabled={battle.summonGauge < 100 || battle.summonUsed || !summon}
              onClick={() => act(() => callSummon(battle))}
              title={summon ? summon.callName : '召喚石なし'}
            >
              <span>召喚</span>
              <div className="summon-gauge">
                <div style={{ width: `${battle.summonGauge}%` }} />
              </div>
              <small>{summon?.name ?? '—'}</small>
            </button>

            <button
              type="button"
              className="cmd attack"
              onClick={() => {
                setAbilOpen(false)
                act(() => pressAttack(battle))
              }}
            >
              攻撃
            </button>

            <button type="button" className="cmd abil" onClick={() => setAbilOpen((v) => !v)}>
              アビリティ
            </button>
          </div>
        </section>
      )}

      {battle.phase === 'enemy' && <p className="phase-msg">敵の行動…</p>}

      {(battle.phase === 'won' || battle.phase === 'lost') && (
        <section className="result">
          <h2>{battle.phase === 'won' ? 'CLEAR' : 'DEFEAT'}</h2>
          {battle.phase === 'won' && (
            <p>
              ◎{quest.rewards.rupies}　◆{quest.rewards.crystals}　EXP {quest.rewards.exp}
            </p>
          )}
          <button type="button" className="btn primary" onClick={() => navigate('/quests')}>
            クエストへ
          </button>
        </section>
      )}

      <section className="btl-log">
        {[...battle.logs].reverse().slice(0, 8).map((l) => (
          <div key={l.id} className={`log-${l.kind}`}>
            {l.text}
          </div>
        ))}
      </section>
    </div>
  )
}
