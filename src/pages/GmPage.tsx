import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useGm } from '../context/GmContext'
import { GM_UNLOCK_CODE, gmClearQuests, gmRefill, gmUnlockAll } from '../lib/gm'
import './GmPage.css'

export function GmPage() {
  const { profile, updateProfile } = useAuth()
  const { gmEnabled, godMode, setGmEnabled, setGodMode } = useGm()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  async function unlock(e: FormEvent) {
    e.preventDefault()
    setErr('')
    setMsg('')
    if (code.trim().toUpperCase() !== GM_UNLOCK_CODE) {
      setErr('コードが違います')
      return
    }
    setGmEnabled(true)
    setMsg('GMモードを解放しました')
    setCode('')
  }

  async function run(label: string, fn: () => Promise<void>) {
    setErr('')
    setMsg('')
    try {
      await fn()
      setMsg(label)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '失敗しました')
    }
  }

  if (!profile) return null

  return (
    <div className="gm-page ff-page">
      <header className="ff-window page-head">
        <h1>ゲームマスター</h1>
        <p>開発・検証用コマンド</p>
      </header>

      {!gmEnabled ? (
        <form className="ff-window gm-unlock" onSubmit={unlock}>
          <p className="ff-cursor-line">解放コードを入力してください</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CODE"
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="btn primary">
            解放
          </button>
          <p className="hint">ヒント: 役職の略称（2文字）</p>
        </form>
      ) : (
        <div className="gm-panel">
          <section className="ff-window">
            <h2>ステータス</h2>
            <label className="gm-toggle">
              <input
                type="checkbox"
                checked={gmEnabled}
                onChange={(e) => setGmEnabled(e.target.checked)}
              />
              <span>GMモード ON</span>
            </label>
            <label className="gm-toggle">
              <input
                type="checkbox"
                checked={godMode}
                onChange={(e) => setGodMode(e.target.checked)}
              />
              <span>ゴッドモード（被ダメ0・与ダメ極大）</span>
            </label>
            <p className="note">クエストのAP/BP消費も免除されます</p>
          </section>

          <section className="ff-window gm-actions">
            <h2>コマンド</h2>
            <button
              type="button"
              className="btn primary"
              onClick={() =>
                run('全解放・強化完了', async () => {
                  await updateProfile(gmUnlockAll(profile))
                })
              }
            >
              全キャラ／装備解放
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                run('資源を全回復しました', async () => {
                  await updateProfile(gmRefill(profile))
                })
              }
            >
              資源・AP/EP 全回復
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                run('全クエストクリア扱い', async () => {
                  await updateProfile(gmClearQuests(profile))
                })
              }
            >
              全クエストクリア
            </button>
          </section>
        </div>
      )}

      {msg && <p className="gm-msg ok">{msg}</p>}
      {err && <p className="gm-msg err">{err}</p>}
    </div>
  )
}
