import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, RotateCcw, X, AlertTriangle, ExternalLink } from 'lucide-react'

// 價目表讀寫都走 ugg-suite（Google 服務帳號金鑰只在那個專案，對外 APP 不放金鑰）。
// 客人看的價目頁走 gviz CSV 直讀，不經過這裡；這支是「要驗身分」的編輯端。
const API = 'https://ugg-suite.vercel.app/api/food-menu'
// 沒有登記手機的帳號（例如管理員登入）改不了，給一條直接編試算表的路
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw/edit#gid=2121065632'

// 補零食是主要情境，所以零食排最前面
const CATEGORIES = ['零食', '餐點', '飲料']
const CAT_STYLE = {
  零食: 'from-yellow-500 to-amber-500',
  餐點: 'from-orange-500 to-amber-500',
  飲料: 'from-sky-500 to-cyan-500',
}

const card = 'bg-white border border-stone-200 rounded-2xl'
const input =
  'px-2.5 py-2 rounded-xl border border-stone-200 text-base text-stone-700 focus:outline-none focus:border-orange-400 bg-white'

const trimmed = (v) => String(v ?? '').trim()
const isPrice = (v) => /^\d+(\.\d+)?$/.test(trimmed(v))

/** 只取真的被改過的欄位，沒動的不送——少送一欄就少一次覆蓋別人改動的機會 */
function diffOf(item, draft) {
  const patch = {}
  for (const k of ['name', 'unit', 'price', 'desc']) {
    if (draft[k] !== undefined && trimmed(draft[k]) !== trimmed(item[k])) patch[k] = trimmed(draft[k])
  }
  if (draft.stopped !== undefined && draft.stopped !== item.stopped) patch.stopped = draft.stopped
  return patch
}

function Row({ item, draft, onChange }) {
  const v = (k) => (draft[k] !== undefined ? draft[k] : item[k])
  const stopped = draft.stopped !== undefined ? draft.stopped : item.stopped
  const dirty = Object.keys(diffOf(item, draft)).length > 0
  const priceBad = !isPrice(v('price'))

  return (
    <div className={`px-3 py-2.5 ${dirty ? 'bg-amber-50' : ''} ${stopped ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5">
        <input
          value={v('name')}
          onChange={(e) => onChange({ name: e.target.value })}
          className={`${input} flex-1 min-w-0`}
          placeholder="品名"
        />
        <input
          value={v('unit')}
          onChange={(e) => onChange({ unit: e.target.value })}
          className={`${input} w-16 shrink-0 text-center`}
          placeholder="單位"
        />
        <input
          value={v('price')}
          onChange={(e) => onChange({ price: e.target.value })}
          inputMode="numeric"
          className={`${input} w-16 shrink-0 text-center font-bold ${priceBad ? 'border-red-400 text-red-500' : 'text-orange-600'}`}
          placeholder="價格"
        />
        <button
          type="button"
          onClick={() => onChange({ stopped: !stopped })}
          className={`shrink-0 px-2.5 py-2 rounded-xl text-xs font-bold border transition ${
            stopped ? 'bg-stone-600 text-white border-stone-600' : 'bg-white text-stone-400 border-stone-200'
          }`}
        >
          停售
        </button>
      </div>
      {(item.editor || item.editedAt) && (
        <p className="text-[11px] text-stone-400 mt-1 pl-1">
          最後修改：{item.editor || '—'} {item.editedAt || ''}
        </p>
      )}
    </div>
  )
}

export default function FoodMenuEditor({ phone, canEdit = true }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState({})     // row -> 已改動的欄位
  const [newItems, setNewItems] = useState([]) // 待新增
  const [form, setForm] = useState({ category: '零食', name: '', unit: '一包', price: '' })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function load() {
    setError('')
    try {
      const res = await fetch(`${API}?_=${Date.now()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setItems(json.items)
      setDrafts({})
      setNewItems([])
    } catch (err) {
      console.error('價目表載入失敗', err)
      setError(err.message)
    }
  }

  useEffect(() => { load() }, [])

  const ops = useMemo(() => {
    if (!items) return []
    const out = []
    for (const it of items) {
      const patch = diffOf(it, drafts[it.row] || {})
      // name 一律附上：後端要用「送出當下看到的品名」比對列號有沒有位移
      if (Object.keys(patch).length) out.push({ type: 'update', row: it.row, name: it.name, patch })
    }
    for (const it of newItems) out.push({ type: 'add', item: it })
    return out
  }, [items, drafts, newItems])

  const hasBadPrice = useMemo(() => {
    if (!items) return false
    return items.some((it) => {
      const d = drafts[it.row]
      return d && Object.keys(diffOf(it, d)).length > 0 && !isPrice(d.price !== undefined ? d.price : it.price)
    })
  }, [items, drafts])

  const setDraft = (row, patch) =>
    setDrafts((prev) => ({ ...prev, [row]: { ...(prev[row] || {}), ...patch } }))

  function addPending() {
    const name = trimmed(form.name)
    if (!name) return setNotice('請先填品名')
    if (!isPrice(form.price)) return setNotice('價格要填數字')
    setNewItems((prev) => [...prev, { ...form, name, price: trimmed(form.price), unit: trimmed(form.unit) }])
    setForm({ category: form.category, name: '', unit: form.category === '零食' ? '一包' : '', price: '' })
    setNotice('')
  }

  async function save() {
    if (!ops.length || saving) return
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
      setItems(json.items)
      setDrafts({})
      setNewItems([])
      setNotice(`已存檔：改 ${json.updated} 項、新增 ${json.added} 項，客人約 2 秒後就會看到。`)
    } catch (err) {
      setNotice(`存檔失敗：${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <div className={`${card} p-5 text-center space-y-2`}>
        <p className="text-stone-700 font-bold">價目表載入不了</p>
        <p className="text-sm text-stone-500">{error}</p>
        <button onClick={load} className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold">
          再試一次
        </button>
      </div>
    )
  }
  if (!items) return <div className={`${card} p-8 text-center text-stone-400 text-sm`}>載入中…</div>

  return (
    <div className="space-y-3 pb-24">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
        <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-stone-600 leading-relaxed">
          存檔後客人的價目頁<span className="font-bold text-amber-700">約 2 秒就換成新的</span>，沒有草稿也沒有預覽。
          {canEdit ? ' 每一列都會記下是誰改的。' : ''}
        </p>
      </div>

      {!canEdit && (
        <div className="bg-stone-100 border border-stone-200 rounded-2xl p-3 space-y-2">
          <p className="text-sm text-stone-600 leading-relaxed">
            這個帳號沒有登記手機號碼（管理員登入就是這種），系統認不出是誰改的，所以只能查看。
            要在這裡改，得用有登記手機的店員身分登入。
          </p>
          <a
            href={SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold"
          >
            <ExternalLink size={15} /> 用 Google 試算表編輯
          </a>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const list = items.filter((it) => it.category === cat)
        const pending = newItems.filter((it) => it.category === cat)
        if (!list.length && !pending.length) return null
        return (
          <div key={cat} className={`${card} overflow-hidden`}>
            <div className={`bg-gradient-to-r ${CAT_STYLE[cat]} px-4 py-2.5`}>
              <h3 className="font-bold text-white text-base">{cat}</h3>
            </div>
            <div className="divide-y divide-stone-100">
              {list.map((it) => (
                <Row
                  key={it.row}
                  item={it}
                  draft={drafts[it.row] || {}}
                  onChange={(p) => canEdit && setDraft(it.row, p)}
                />
              ))}
              {pending.map((it, i) => (
                <div key={`new-${i}`} className="px-3 py-2.5 bg-emerald-50 flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-600 shrink-0">新增</span>
                  <span className="flex-1 min-w-0 truncate text-base text-stone-700">{it.name}</span>
                  {it.unit && <span className="text-xs text-stone-400 shrink-0">{it.unit}</span>}
                  <span className="font-bold text-orange-600 shrink-0">{it.price} 元</span>
                  <button
                    type="button"
                    onClick={() => setNewItems((prev) => prev.filter((x) => x !== it))}
                    className="shrink-0 text-stone-400 p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {canEdit && (
        <div className={`${card} p-3 space-y-2`}>
          <p className="text-sm font-bold text-stone-700">新增品項</p>
          <div className="flex items-center gap-1.5">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, unit: e.target.value === '零食' ? '一包' : '' }))}
              className={`${input} w-20 shrink-0`}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={`${input} flex-1 min-w-0`}
              placeholder="品名"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className={`${input} w-20 shrink-0 text-center`}
              placeholder="單位"
            />
            <input
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              inputMode="numeric"
              className={`${input} w-20 shrink-0 text-center font-bold text-orange-600`}
              placeholder="價格"
            />
            <button
              type="button"
              onClick={addPending}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 text-white text-sm font-bold"
            >
              <Plus size={16} /> 加入清單
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p className={`text-sm text-center ${notice.includes('失敗') ? 'text-red-500' : 'text-emerald-600'}`}>
          {notice}
        </p>
      )}

      {/* 存檔列固定在底部：手機捲到一半也按得到 */}
      {canEdit && ops.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 px-3 pb-4 pt-3 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-lg mx-auto flex gap-2">
            <button
              type="button"
              onClick={load}
              disabled={saving}
              className="px-3 py-3 rounded-2xl border border-stone-200 bg-white text-stone-500 text-sm font-bold flex items-center gap-1"
            >
              <RotateCcw size={16} /> 放棄
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || hasBadPrice}
              className="flex-1 py-3 rounded-2xl bg-orange-500 text-white text-base font-bold shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save size={18} />
              {saving ? '存檔中…' : hasBadPrice ? '有價格不是數字' : `儲存 ${ops.length} 項變更`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
