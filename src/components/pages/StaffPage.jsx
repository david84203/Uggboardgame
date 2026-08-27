import { useState, useMemo } from 'react'
import { CalendarDays, Sparkles, GraduationCap, ChevronLeft, ChevronRight, Check, Clock, MapPin, Users } from 'lucide-react'
import GameCard from '../GameCard'
import useStaffProfile from '../../hooks/useStaffProfile'
import useStaffSkills from '../../hooks/useStaffSkills'
import useSchedule, { useUpcomingShifts } from '../../hooks/useSchedule'

const PALETTE = {
  orange: { dot: '#f97316', chip: 'bg-orange-100 text-orange-700' },
  blue: { dot: '#3b82f6', chip: 'bg-blue-100 text-blue-700' },
  green: { dot: '#22c55e', chip: 'bg-green-100 text-green-700' },
  purple: { dot: '#a855f7', chip: 'bg-purple-100 text-purple-700' },
  pink: { dot: '#ec4899', chip: 'bg-pink-100 text-pink-700' },
  teal: { dot: '#14b8a6', chip: 'bg-teal-100 text-teal-700' },
  amber: { dot: '#f59e0b', chip: 'bg-amber-100 text-amber-800' },
  rose: { dot: '#f43f5e', chip: 'bg-rose-100 text-rose-700' },
}
const chipOf = (k) => (PALETTE[k] || PALETTE.orange).chip
const dotOf = (k) => (PALETTE[k] || PALETTE.orange).dot

const card = 'bg-white border border-stone-200 rounded-2xl'
const pad2 = (n) => String(n).padStart(2, '0')
const ymOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
const dayStr = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`
const todayStr = () => {
  const n = new Date()
  return dayStr(n.getFullYear(), n.getMonth() + 1, n.getDate())
}

/** 月曆格子只有指頭寬，長名字放不下：中文取 2 字、英文取 3 字，全名靠下方圖例辨識 */
function shortName(name = '') {
  const n = String(name).trim()
  if (n.length <= 3) return n
  return /^[a-zA-Z]/.test(n) ? n.slice(0, 3) : n.slice(0, 2)
}

// ── 排班表（唯讀，與入場系統同一份資料）─────────────────────────────────────
function ScheduleTab({ viewStaff }) {
  const [cursor, setCursor] = useState(() => new Date())
  const ym = ymOf(cursor)
  const { shifts, loading } = useSchedule(ym)

  const year = cursor.getFullYear()
  const month = cursor.getMonth() + 1
  const today = todayStr()

  const byDate = useMemo(() => {
    const m = {}
    shifts.forEach((s) => {
      if (!m[s.date]) m[s.date] = []
      m[s.date].push(s)
    })
    return m
  }, [shifts])

  // 我接下來的班（跨月，不受目前看的月份影響）
  const myNext = useUpcomingShifts(viewStaff?.id, 3)

  // 本月有排班的人，給月曆下方當圖例（格子太窄，名字會被截斷）
  const legend = useMemo(() => {
    const m = new Map()
    shifts.forEach((s) => { if (!m.has(s.staffId)) m.set(s.staffId, { name: s.name, color: s.color }) })
    return Array.from(m.values())
  }, [shifts])

  // 月曆格子：週一起算，與入場系統的排班表一致
  const cells = useMemo(() => {
    const first = new Date(year, month - 1, 1)
    const lead = (first.getDay() + 6) % 7
    const total = new Date(year, month, 0).getDate()
    const out = []
    for (let i = 0; i < lead; i++) out.push(null)
    for (let d = 1; d <= total; d++) out.push(d)
    return out
  }, [year, month])

  const shiftMonth = (delta) => setCursor(new Date(year, month - 1 + delta, 1))

  return (
    <div className="space-y-4">
      {myNext.length > 0 && (
        <div className={`${card} p-4`}>
          <div className="text-sm font-bold text-stone-800 mb-2">我接下來的班</div>
          <div className="space-y-1.5">
            {myNext.map((s) => {
              const [, m, d] = s.date.split('-')
              const w = ['日', '一', '二', '三', '四', '五', '六'][new Date(s.date).getDay()]
              return (
                <div key={s.id} className="flex items-center gap-2 text-sm text-stone-600">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.date === today ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
                    {s.date === today ? '今天' : `${Number(m)}/${Number(d)}`}
                  </span>
                  <span className="text-stone-400">（{w}）</span>
                  <span className="flex items-center gap-1"><Clock size={13} />{s.start}–{s.end}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={`${card} p-3`}>
        <div className="flex items-center justify-between px-1 pb-3">
          <button onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition">
            <ChevronLeft size={18} />
          </button>
          <div className="text-base font-bold text-stone-800">{year} 年 {month} 月</div>
          <button onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400 pb-1">
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => <div key={w}>{w}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />
            const ds = dayStr(year, month, d)
            const list = byDate[ds] || []
            const isToday = ds === today
            const isWeekend = [0, 6].includes(new Date(ds).getDay())
            return (
              <div key={ds} className={`min-h-[58px] rounded-lg p-1 border ${isToday ? 'border-orange-400 bg-orange-50/60' : 'border-stone-100'}`}>
                <div className={`text-[11px] font-semibold ${isToday ? 'text-orange-600' : isWeekend ? 'text-red-400' : 'text-stone-500'}`}>{d}</div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {list.map((s) => {
                    const mine = viewStaff && s.staffId === viewStaff.id
                    return (
                      <span key={s.id} title={`${s.name} ${s.start}–${s.end}`}
                        className={`text-[10px] leading-tight px-1 py-0.5 rounded text-center ${chipOf(s.color)} ${mine ? 'ring-1 ring-stone-400 font-bold' : ''}`}>
                        {shortName(s.name)}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {loading && <p className="text-center text-xs text-stone-400 pt-3">載入中…</p>}

        {legend.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-3">
            {legend.map((p) => (
              <span key={p.name} className="flex items-center gap-1 text-[11px] text-stone-500">
                <span className="w-2 h-2 rounded-full" style={{ background: dotOf(p.color) }} />
                {p.name}
              </span>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-stone-400 pt-3">
          班表由店長在入場系統排定，這裡只能看。有問題直接跟店長說。
        </p>
      </div>
    </div>
  )
}

// ── 遊戲小卡（推薦與必學共用）───────────────────────────────────────────────
// 整列可點，開的是 APP 既有的遊戲詳細卡（圖片、簡介、教學影片、租金）
function GameRow({ g, right, onOpen }) {
  return (
    <div className={`${card} p-3 flex items-center gap-3 cursor-pointer active:scale-[0.99] transition`}
      onClick={() => onOpen?.(g)}>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-stone-800 truncate">{g.name}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500 mt-1">
          {/* 有填「客人人數」就顯示它，那才是店員推薦時要看的數字 */}
          {g.guestCountRaw ? (
            <span className="flex items-center gap-0.5 text-orange-600 font-medium"><Users size={11} />建議 {g.guestCountRaw} 人</span>
          ) : (
            g.playersRaw && <span className="flex items-center gap-0.5"><Users size={11} />{g.playersRaw} 人</span>
          )}
          {g.playTimeRaw && g.playTimeRaw !== 'N/A' && <span className="flex items-center gap-0.5"><Clock size={11} />{g.playTimeRaw} 分</span>}
          {g.location && <span className="flex items-center gap-0.5"><MapPin size={11} />{g.location}</span>}
          {g.weight != null && <span>難度 {g.weight.toFixed(1)}</span>}
        </div>
      </div>
      {/* 右側按鈕不該連帶開詳細卡 */}
      {right && <div onClick={(e) => e.stopPropagation()}>{right}</div>}
      {!right && <ChevronRight size={16} className="text-stone-300 shrink-0" />}
    </div>
  )
}

// ── 推薦遊戲：人數自動算，需求標籤由 Sheet 的「店員推薦」欄決定 ──────────────
function PicksTab({ games, gamesLoading, onOpenGame }) {
  const [people, setPeople] = useState('')
  const [tag, setTag] = useState('')

  const allTags = useMemo(() => {
    const s = new Set()
    games.forEach((g) => (g.staffPicks || []).forEach((t) => s.add(t)))
    return Array.from(s)
  }, [games])

  const result = useMemo(() => {
    let list = games.filter((g) => (g.staffPicks || []).length > 0)
    if (tag) list = list.filter((g) => (g.staffPicks || []).includes(tag))
    if (people) {
      const n = Number(people)
      list = list.filter((g) => {
        // 優先用「客人人數」（實際好玩的人數）；沒填才退回盒子上的遊戲人數
        const lo = g.minGuests ?? g.minPlayers
        const hi = g.maxGuests ?? g.maxPlayers
        return lo != null && hi != null && n >= lo && n <= hi
      })
    }
    return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  }, [games, tag, people])

  const pill = (active) =>
    `px-3 py-1.5 rounded-full text-xs font-medium border transition ${
      active ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-stone-200 text-stone-600 hover:border-orange-300'
    }`

  if (gamesLoading) return <p className="text-center text-sm text-stone-400 py-10">載入遊戲資料中…</p>

  if (allTags.length === 0) {
    return (
      <div className={`${card} p-5 text-center`}>
        <p className="text-sm text-stone-600 font-medium">還沒有設定推薦遊戲</p>
        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
          店長在遊戲列表 Sheet 的「店員推薦」欄填上情境（例如 新手、情侶、大團體），<br />這裡就會自動長出來。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={`${card} p-4 space-y-3`}>
        <div>
          <div className="text-xs font-bold text-stone-500 mb-2">幾個人玩</div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setPeople('')} className={pill(!people)}>不限</button>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button key={n} onClick={() => setPeople(String(n))} className={pill(people === String(n))}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold text-stone-500 mb-2">什麼樣的客人</div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTag('')} className={pill(!tag)}>全部</button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTag(t)} className={pill(tag === t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-stone-400">{result.length} 款可推薦</span>
        {(people || tag) && (
          <button onClick={() => { setPeople(''); setTag('') }} className="text-xs text-orange-500">清除條件</button>
        )}
      </div>

      <div className="space-y-2">
        {result.map((g) => <GameRow key={g.id} g={g} onOpen={onOpenGame} />)}
        {result.length === 0 && (
          <div className={`${card} p-5 text-center text-sm text-stone-400`}>
            這個組合沒有推薦的遊戲，把條件放寬一點試試
          </div>
        )}
      </div>
    </div>
  )
}

// ── 必學遊戲：自評 / 驗證兩層獨立 ────────────────────────────────────────────
const STAGE = { 1: { title: '新人必學', desc: '這些一定要會，客人最常點' }, 2: { title: '進階', desc: '學會這些就能接大部分的桌' } }

function LearnTab({ games, gamesLoading, viewStaff, canVerify, isSelf, onOpenGame }) {
  const { getStatus, toggleSelf, toggleVerified, loading: skillsLoading } = useStaffSkills()
  const [busy, setBusy] = useState('')

  const groups = useMemo(() => {
    const g = { 1: [], 2: [] }
    games.forEach((x) => { if (x.mustLearn === 1 || x.mustLearn === 2) g[x.mustLearn].push(x) })
    Object.values(g).forEach((arr) => arr.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant')))
    return g
  }, [games])

  const total = groups[1].length + groups[2].length
  const verifiedCount = useMemo(() => {
    if (!viewStaff) return 0
    return [...groups[1], ...groups[2]].filter((g) => getStatus(viewStaff.id, g.name) === 'verified').length
  }, [groups, viewStaff, getStatus])
  const selfCount = useMemo(() => {
    if (!viewStaff) return 0
    return [...groups[1], ...groups[2]].filter((g) => getStatus(viewStaff.id, g.name) === 'self').length
  }, [groups, viewStaff, getStatus])

  async function act(fn, key) {
    setBusy(key)
    try { await fn() } catch (e) { alert(`更新失敗：${e?.message || '請稍後再試'}`) }
    finally { setBusy('') }
  }

  if (gamesLoading || skillsLoading) return <p className="text-center text-sm text-stone-400 py-10">載入中…</p>
  if (!viewStaff) return <p className="text-center text-sm text-stone-400 py-10">請先選擇店員</p>

  if (total === 0) {
    return (
      <div className={`${card} p-5 text-center`}>
        <p className="text-sm text-stone-600 font-medium">還沒有指定必學遊戲</p>
        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
          店長在遊戲列表 Sheet 的「必學」欄填 1（新人必學）或 2（進階），<br />這裡就會列出來。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={`${card} p-4`}>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-bold text-stone-800">{viewStaff.name} 的進度</span>
          <span className="text-sm text-stone-500"><strong className="text-emerald-600 text-lg">{verifiedCount}</strong> / {total} 已驗證</span>
        </div>
        <div className="h-2 rounded-full bg-stone-100 overflow-hidden flex">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${(verifiedCount / total) * 100}%` }} />
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${(selfCount / total) * 100}%` }} />
        </div>
        <div className="flex gap-4 mt-2 text-[11px] text-stone-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />已驗證 {verifiedCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />自評待驗 {selfCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-stone-200" />未學 {total - verifiedCount - selfCount}</span>
        </div>
      </div>

      {[1, 2].map((stage) => {
        if (groups[stage].length === 0) return null
        return (
          <div key={stage} className="space-y-2">
            <div className="px-1">
              <div className="text-sm font-bold text-stone-700">{STAGE[stage].title}</div>
              <div className="text-[11px] text-stone-400">{STAGE[stage].desc}</div>
            </div>
            {groups[stage].map((g) => {
              const status = getStatus(viewStaff.id, g.name)
              const key = `${viewStaff.id}::${g.name}`
              const isBusy = busy === key
              return (
                <GameRow key={g.id} g={g} onOpen={onOpenGame} right={
                  <div className="flex items-center gap-1.5 shrink-0">
                    {status === 'verified' && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1">
                        <Check size={12} />已驗證
                      </span>
                    )}
                    {status === 'self' && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-bold">待驗證</span>
                    )}
                    {status === 'none' && (
                      <span className="text-[11px] px-2 py-1 rounded-lg bg-stone-100 text-stone-400">未學</span>
                    )}

                    {isSelf && (
                      <button disabled={isBusy} onClick={() => act(() => toggleSelf(viewStaff, g.name), key)}
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition disabled:opacity-40">
                        {status === 'none' ? '我學會了' : '取消'}
                      </button>
                    )}
                    {canVerify && (
                      <button disabled={isBusy} onClick={() => act(() => toggleVerified(viewStaff, g.name), key)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition disabled:opacity-40 ${
                          status === 'verified' ? 'border border-stone-200 text-stone-500 hover:bg-stone-50' : 'bg-emerald-500 text-white hover:opacity-90'
                        }`}>
                        {status === 'verified' ? '取消驗證' : '驗證通過'}
                      </button>
                    )}
                  </div>
                } />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── 主頁 ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'schedule', label: '排班表', icon: CalendarDays },
  { id: 'picks', label: '推薦遊戲', icon: Sparkles },
  { id: 'learn', label: '必學遊戲', icon: GraduationCap },
]

export default function StaffPage({ member, games = [], gamesLoading = false, onNavigate }) {
  const { staffList, staff, isStaff, isOwner, loading } = useStaffProfile(member)
  const [tab, setTab] = useState('schedule')
  const [ownerViewId, setOwnerViewId] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)

  // excluded = 排班表裡的虛擬人（例如「工讀生(估)」，只拿來估人力成本），不是真的店員
  const activeStaff = useMemo(
    () => staffList.filter((s) => s.employment !== 'excluded'),
    [staffList]
  )
  const viewStaff = isOwner
    ? activeStaff.find((s) => s.id === ownerViewId) || activeStaff[0] || null
    : staff

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><p className="text-stone-400 text-sm">載入中…</p></div>

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <div className="text-4xl mb-3">🔒</div>
        <p className="text-base font-bold text-stone-800">請先登入</p>
        <p className="text-sm text-stone-500 mt-1">店員專區需要先在會員專區登入</p>
        <button onClick={() => onNavigate?.('member')} className="mt-5 px-5 py-2.5 rounded-2xl bg-orange-500 text-white text-sm font-bold">
          前往登入
        </button>
      </div>
    )
  }

  if (!isStaff && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <div className="text-4xl mb-3">🙅</div>
        <p className="text-base font-bold text-stone-800">此區僅限店員使用</p>
        <p className="text-sm text-stone-500 mt-1">如果你是店員，請跟店長確認登記的手機號碼</p>
      </div>
    )
  }

  return (
    <div className="px-3 pb-10 space-y-4">
      {/* 身分列 */}
      <div className={`${card} p-4 flex items-center gap-3`}>
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ background: dotOf(viewStaff?.color) }}>
          {(viewStaff?.name || '?').slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          {isOwner ? (
            <>
              <div className="text-[11px] text-orange-500 font-bold">管理員視角</div>
              <select value={viewStaff?.id || ''} onChange={(e) => setOwnerViewId(e.target.value)}
                className="mt-0.5 text-sm font-bold text-stone-800 bg-transparent focus:outline-none">
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.employment === 'support' ? '（支援）' : ''}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <div className="text-[11px] text-stone-400">店員模式</div>
              <div className="text-sm font-bold text-stone-800">{viewStaff?.name}</div>
            </>
          )}
        </div>
      </div>

      {/* 分頁 */}
      <div className="flex gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-medium transition ${
                active ? 'bg-orange-500 text-white shadow-sm shadow-orange-200' : 'bg-white border border-stone-200 text-stone-500'
              }`}>
              <Icon size={17} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'schedule' && <ScheduleTab viewStaff={viewStaff} />}
      {tab === 'picks' && <PicksTab games={games} gamesLoading={gamesLoading} onOpenGame={setSelectedGame} />}
      {tab === 'learn' && (
        <LearnTab
          games={games}
          gamesLoading={gamesLoading}
          viewStaff={viewStaff}
          canVerify={isOwner}
          isSelf={!isOwner && staff?.id === viewStaff?.id}
          onOpenGame={setSelectedGame}
        />
      )}

      {/* 遊戲詳細：直接用遊戲清單那張卡，圖片／簡介／教學影片／租金都在裡面 */}
      {selectedGame && (
        <GameCard
          game={selectedGame}
          defaultOpen={true}
          hideCard={true}
          onModalClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  )
}
