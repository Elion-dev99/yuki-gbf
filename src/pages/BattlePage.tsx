import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CHARACTER_MAP } from '../data/characters'
import { QUEST_MAP } from '../data/quests'
import {
  applyQuestRewards,
  normalAttack,
  performCharge,
  performSkill,
  runEnemyTurn,
  startBattle,
} from '../lib/gameLogic'
import type { BattleState } from '../types/game'
import { ELEMENT_LABEL } from '../types/game'
import './BattlePage.css'

export function BattlePage() {
  const { questId } = useParams()
  const { profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const quest = questId ? QUEST_MAP[questId] : undefined
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [enemyTarget, setEnemyTarget] = useState(0)
  const [error, setError] = useState('')
  const [rewardApplied, setRewardApplied] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!profile || !quest) return
    try {
      const b = startBattle(quest, profile)
      setBattle(b)
      setEnemyTarget(0)
      setRewardApplied(false)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'バトル開始に失敗')
    }
    // Intentionally only re-init when quest route changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile/quest captured at quest entry
  }, [questId])

  const phase = battle?.phase
  const turn = battle?.turn

  useEffect(() => {
    if (phase !== 'enemy') return
    const t = window.setTimeout(() => {
      setBattle((prev) => (prev ? runEnemyTurn(prev) : prev))
      setFlash(true)
      window.setTimeout(() => setFlash(false), 280)
    }, 650)
    return () => window.clearTimeout(t)
  }, [phase, turn])

  useEffect(() => {
    async function giveRewards() {
      if (!battle || !profile || !quest || battle.phase !== 'won' || rewardApplied) return
      const next = applyQuestRewards(profile, quest)
      await updateProfile(next)
      setRewardApplied(true)
    }
    void giveRewards()
  }, [phase, battle, profile, quest, rewardApplied, updateProfile])

  const selected = battle?.allies[battle.selectedAlly]
  const skillDefs = useMemo(() => {
    if (!selected) return []
    return CHARACTER_MAP[selected.defId]?.skills ?? []
  }, [selected])

  if (error) {
    return (
      <div className="battle-page">
        <p className="warn">{error}</p>
        <Link to="/party">編成へ</Link>
      </div>
    )
  }

  if (!quest || !battle) {
    return (
      <div className="battle-page">
        <p>準備中…</p>
      </div>
    )
  }

  function act(fn: () => BattleState) {
    setFlash(true)
    window.setTimeout(() => setFlash(false), 280)
    setBattle(fn())
  }

  return (
    <div className={`battle-page ${flash ? 'flash' : ''}`}>
      <header className="battle-header">
        <div>
          <p className="kicker">{quest.name}</p>
          <h1>ターン {battle.turn}</h1>
        </div>
        <button type="button" className="retreat" onClick={() => navigate('/quests')}>
          撤退
        </button>
      </header>

      <section className="battlefield">
        <div className="side enemies">
          <h2>敵</h2>
          {battle.enemies.map((e, i) => (
            <button
              key={e.uid}
              type="button"
              className={`fighter enemy ${e.hp <= 0 ? 'down' : ''} ${enemyTarget === i ? 'targeted' : ''} ${e.isBoss ? 'boss' : ''}`}
              disabled={e.hp <= 0}
              onClick={() => setEnemyTarget(i)}
            >
              <div className="fighter-top">
                <span>
                  {e.name} · {ELEMENT_LABEL[e.element]}
                </span>
                <span>
                  {e.hp}/{e.maxHp}
                </span>
              </div>
              <div className="hp-bar">
                <div style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
              </div>
            </button>
          ))}
        </div>

        <div className="side allies">
          <h2>味方</h2>
          {battle.allies.map((a, i) => (
            <button
              key={a.uid}
              type="button"
              className={`fighter ally ${a.hp <= 0 ? 'down' : ''} ${battle.selectedAlly === i ? 'selected' : ''}`}
              disabled={a.hp <= 0 || battle.phase !== 'player'}
              onClick={() => setBattle({ ...battle, selectedAlly: i })}
            >
              <div className="fighter-top">
                <span>
                  {a.name} · {ELEMENT_LABEL[a.element]}
                </span>
                <span>
                  {a.hp}/{a.maxHp}
                </span>
              </div>
              <div className="hp-bar">
                <div style={{ width: `${(a.hp / a.maxHp) * 100}%` }} />
              </div>
              <div className="charge-bar">
                <div style={{ width: `${a.charge}%` }} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {battle.phase === 'player' && selected && selected.hp > 0 && (
        <section className="actions">
          <p className="acting">行動: {selected.name}</p>
          <div className="action-row">
            <button
              type="button"
              className="btn secondary"
              onClick={() => act(() => normalAttack(battle, battle.selectedAlly, enemyTarget))}
            >
              攻撃
            </button>
            <button
              type="button"
              className="btn charge"
              disabled={selected.charge < 100}
              onClick={() => act(() => performCharge(battle, battle.selectedAlly, enemyTarget))}
            >
              奥義 {selected.charge}/100
            </button>
          </div>
          <div className="skill-row">
            {skillDefs.map((s) => {
              const cd = selected.skillCds[s.id] ?? 0
              return (
                <button
                  key={s.id}
                  type="button"
                  className="btn skill"
                  disabled={cd > 0}
                  title={s.description}
                  onClick={() =>
                    act(() => performSkill(battle, battle.selectedAlly, s.id, enemyTarget))
                  }
                >
                  {s.name}
                  {cd > 0 ? ` (${cd})` : ''}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {battle.phase === 'enemy' && <p className="phase-msg">敵のターン…</p>}

      {(battle.phase === 'won' || battle.phase === 'lost') && (
        <section className="result-panel">
          <h2>{battle.phase === 'won' ? 'クエストクリア！' : '敗北…'}</h2>
          {battle.phase === 'won' && quest && (
            <p>
              報酬 ◎{quest.rewards.rupies} / ◆{quest.rewards.crystals} / EXP {quest.rewards.exp}
            </p>
          )}
          <div className="action-row">
            <button type="button" className="btn primary" onClick={() => navigate('/quests')}>
              クエスト一覧へ
            </button>
            <button type="button" className="btn secondary" onClick={() => navigate('/home')}>
              ホームへ
            </button>
          </div>
        </section>
      )}

      <section className="log-panel">
        <h2>バトルログ</h2>
        <ul>
          {[...battle.logs].reverse().slice(0, 12).map((l) => (
            <li key={l.id} className={`log-${l.kind}`}>
              {l.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
