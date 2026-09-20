import { useMemo, useState } from 'react'
import { Search, Save, AlertTriangle, ExternalLink, X } from 'lucide-react'

// 開盒遊戲列表的讀寫都走 ugg-suite（Google 服務帳號金鑰只在那個專案，對外 APP 不放金鑰）。
// 客人看的遊戲清單走發布版 CSV 直讀，不經過這裡；這支是「要驗身分」的編輯端。
// 為什麼搜尋也打 API：1700 多款不可能整包丟手機，而且改寫要靠 Sheet 的實際列號定位，
// 客人端那份 CSV 會跳過空列，列號推算錯就會改到別款遊戲。
const API = 'https://ugg-suite.vercel.app/api/write-sheet'
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw/edit#gid=540615026'

// Sheet 存的是單字（綠/黃/紅），客人卡片上顯示成同色圓圈
const STICKERS = [
  { key: '綠', color: '#22c55e', hint: '好教' },
  { key: '黃', color: '#eab308', hint: '假日不教' },
  { key: '紅', color: '#ef4444', hint: '不教' },
  { key: '藍', color: '#3b82f6', hint: '' },
  { key: '橘', color: '#f97316', hint: '' },
  { key: '紫', color: '#a855f7', hint: '' },
  { key: '粉', color: '#ec4899', hint: '' },
]

const card = 'bg-white border border-stone-200 rounded-2xl'
const input =
  'px-2.5 py-2 rounded-xl border border-stone-200 text-base text-stone-700 focus:outline-none focus:border-orange-400 bg-white'

const trimmed = (v) => String(v ?? '').trim()
const FIELDS = ['players', 'guest', 'location', 'sticker']
/** 允許空白、「4」、「2-4」 */
const isPlayers = (v) => {
  const s = trimmed(v).replace(/\s*[-–]\s*/, '-')
  return s === '' || /^\d{1,2}$/.test(s) || /^\d{1,2}-\d{1,3}$/.test(s)
}

/** 只送真的被改過的欄位，沒動的不送——少送一欄就少一次蓋掉別人改動的機會 */
function diffOf(game, draft) {
  const patch = {}
  for (const k of FIELDS) {
    if (draft[k] !== undefined && trimmed(draft[k]) !== trimmed(game[k])) patch[k] = trimmed(draft[k])
  }
  return patch
}

function GameRow({ game, draft, canEdit, onChange }) {
  const v = (k) => (draft[k] !== undefined ? draft[k] : game[k])
  const dirty = Object.keys(diffOf(game, draft)).length > 0
  const sticker = v('sticker')

  return (
    <div className={`px-3 py-3 space-y-2 ${dirty ? 'bg-amber-50' : ''}`}>
      <div>
        <p className="font-bold text-stone-800 leading-snug">{game.name}</p>
        {game.englishName && (
          <p className="text-[11px] text-stone-400 leading-snug break-words">{game.englishName}</p>
        )}
      </div>

      <div className="flex gap-1.5">
        <label className="flex-1">
          <span className="block text-[11px] text-stone-400 mb-1">盒子人數</span>
          <input
            value={v('players')} disabled={!canEdit} inputMode="text" placeholder="2-4"
            onChange={(e) => onChange({ players: e.target.value })}
            className={`${input} w-full text-center ${isPlayers(v('players')) ? '' : 'border-red-400 text-red-500'}`}
          />
        </label>
        <label className="flex-1">
          <span className="block text-[11px] text-stone-400 mb-1">實際好玩</span>
          <input
            value={v('guest')} disabled={!canEdit} inputMode="text" placeholder="留空"
            onChange={(e) => onChange({ guest: e.target.value })}
            className={`${input} w-full text-center ${isPlayers(v('guest')) ? '' : 'border-red-400 text-red-500'}`}
          />
        </label>
        <label className="flex-1">
          <span className="block text-[11px] text-stone-400 mb-1">櫃位</span>
          <input
            value={v('location')} disabled={!canEdit} placeholder="F5"
            onChange={(e) => onChange({ location: e.target.value })}
            className={`${input} w-full text-center`}
          />
        </label>
      </div>

      <div>
        <span className="block text-[11px] text-stone-400 mb-1">貼紙</span>
        <div className="flex flex-wrap gap-1.5">
          {STICKERS.map((s) => {
            const on = sticker === s.key
            return (
              <button
                key={s.key} type="button" disabled={!canEdit}
                onClick={() => onChange({ sticker: on ? '' : s.key })}
                className={`flex items-center gap-1 pl-1.5 pr-2.5 py-1.5 rounded-xl border text-xs font-bold transition ${
                  on ? 'border-stone-700 bg-stone-800 text-white' : 'border-stone-200 bg-white text-stone-500'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: s.color }} />
                {s.key}
              </button>
            )
          })}
          {sticker !== '' && canEdit && (
            <button
              type="button" onClick={() => onChange({ sticker: '' })}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-400"
            >
              <X size={13} /> 清掉
            </button>
          )}
        </div>
        {sticker !== '' && STICKERS.find((s) => s.key === sticker)?.hint && (
          <p className="text-[11px] text-stone-400 mt-1">{STICKERS.find((s) => s.key === sticker).hint}</p>
        )}
      </div>

      {(game.editor || game.editedAt) && (
        <p className="text-[11px] text-stone-400">
          最後修改：{game.editor || '—'} {game.editedAt || ''}
        </p>
      )}
    </div>
  )
}

export default function GameSheetEditor({ phone, canEdit = true }) {
  const [q, setQ] = useState('')
  const [games, setGames] = useState(null)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function search(e) {
    e?.preventDefault()
    const keyword = trimmed(q)
    if (!keyword || loading) return
    setLoading(true)
    setNotice('')
    try {
      const res = await fetch(`${API}?q=${encodeURIComponent(keyword)}&_=${Date.now()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setGames(json.games)
      setTruncated(!!json.truncated)
      setDrafts({})
      if (!json.games.length) setNotice(`找不到「${keyword}」，換個關鍵字試試（中文名或英文名都可以）`)
    } catch (err) {
      console.error('遊戲搜尋失敗', err)
      setNotice(`搜尋失敗：${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const ops = useMemo(() => {
    if (!games) return []
    return games
      .map((g) => ({ type: 'update', row: g.row, name: g.name, patch: diffOf(g, drafts[g.row] || {}) }))
      // name 一律附上：後端要用「送出當下看到的遊戲名」確認列號沒被插列刪列位移
      .filter((op) => Object.keys(op.patch).length > 0)
  }, [games, drafts])

  const hasBad = useMemo(() => {
    if (!games) return false
    return games.some((g) => {
      const d = drafts[g.row]
      if (!d || !Object.keys(diffOf(g, d)).length) return false
      return !isPlayers(d.players !== undefined ? d.players : g.players) ||
             !isPlayers(d.guest !== undefined ? d.guest : g.guest)
    })
  }, [games, drafts])

  const setDraft = (row, patch) =>
    setDrafts((prev) => ({ ...prev, [row]: { ...(prev[row] || {}), ...patch } }))

  async function save() {
    if (!ops.length || saving || hasBad) return
    setSaving(true)
    setNotice('')
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ops }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      const byRow = Object.fromEntries(json.updated.map((g) => [g.row, g]))
      setGames((prev) => prev.map((g) => byRow[g.row] || g))
      setDrafts({})
      setNotice(`已存檔 ${json.updated.length} 款，客人端幾分鐘後會換成新的。`)
    } catch (err) {
      setNotice(`存檔失敗：${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-stone-600 leading-relaxed">
          改的是店裡那份開盒遊戲列表，<span className="font-bold text-amber-700">按下存檔就是正式的</span>，
          沒有草稿也沒有復原鍵。{canEdit ? '每一款都會記下是誰改的。' : ''}
          客人手機上的清單有快取，改完要幾分鐘才會換。
        </p>
      </div>

      {!canEdit && (
        <div className="bg-stone-100 border border-stone-200 rounded-2xl p-3 space-y-2">
          <p className="text-sm text-stone-600 leading-relaxed">
            這個帳號沒有登記手機號碼（管理員登入就是這種），系統認不出是誰改的，所以只能查看。
            要在這裡改，得用有登記手機的店員身分登入。
          </p>
          <a
            href={SHEET_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"
          >
            <ExternalLink size={15} /> 用 Google 試算表編輯
          </a>
        </div>
      )}

      <form onSubmit={search} className={`${card} p-3 flex gap-1.5`}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋遊戲名稱"
          className={`${input} flex-1 min-w-0`}
        />
        <button
          type="submit" disabled={loading || !trimmed(q)}
          className="shrink-0 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-1.5"
        >
          <Search size={15} /> {loading ? '找…' : '搜尋'}
        </button>
      </form>

      {notice && (
        <div className="bg-white border border-stone-200 rounded-2xl px-3 py-2.5 text-sm text-stone-600">
          {notice}
        </div>
      )}

      {games && games.length > 0 && (
        <div className={`${card} overflow-hidden divide-y divide-stone-100`}>
          {games.map((g) => (
            <GameRow
              key={g.row} game={g} draft={drafts[g.row] || {}} canEdit={canEdit}
              onChange={(patch) => setDraft(g.row, patch)}
            />
          ))}
        </div>
      )}

      {truncated && (
        <p className="text-xs text-stone-400 text-center">符合的遊戲太多，只列出前 60 款，關鍵字打詳細一點。</p>
      )}

      {canEdit && ops.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={save} disabled={saving || hasBad}
              className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? '存檔中…' : hasBad ? '人數格式要像 4 或 2-4' : `存檔（${ops.length} 款）`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
