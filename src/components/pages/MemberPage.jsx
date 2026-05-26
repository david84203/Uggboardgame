import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { calcLevel, calcNextLevel, LEVELS, EXP_RULES } from '../../utils/exp'
import { getLiffProfile } from '../../utils/liff'
import { Star, Calendar, ChevronDown, ChevronUp, Search, X } from 'lucide-react'

// ── 登入表單 ──────────────────────────────────────────────────────────────────
const GM_MEMBER = {
  id: 'gm-admin',
  name: 'GM',
  nickname: '管理員',
  memberId: '0000',
  phone: 'GM_NO_PHONE',
  birthday: '',
  exp: 9999,
  shoppingCredit: 0,
  isGM: true,
}

function LoginForm({ onLogin, loading, error }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const isGM = name.trim().toUpperCase() === 'GM'

  function handleSubmit(e) {
    e.preventDefault()
    if (isGM) { onLogin('GM', ''); return }
    if (name.trim() && phone.trim()) onLogin(name.trim(), phone.trim())
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👤</div>
          <h2 className="text-xl font-bold text-stone-800">會員專區</h2>
          <p className="text-sm text-stone-500 mt-1">輸入姓名與手機號碼查詢會員資料</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">姓名</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="請輸入姓名"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              style={{ touchAction: 'manipulation' }} />
          </div>
          {!isGM && (
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1.5">手機號碼</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="請輸入手機號碼"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                style={{ touchAction: 'manipulation' }} />
            </div>
          )}
          {isGM && (
            <p className="text-xs text-center text-orange-400">🔑 管理員模式，無需手機號碼</p>
          )}
          {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4">{error}</p>}
          <button type="submit" disabled={(!isGM && (!name.trim() || !phone.trim())) || loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40">
            {loading ? '查詢中…' : isGM ? '🎮 管理員登入' : '查詢會員資料'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── LINE 綁定表單 ──────────────────────────────────────────────────────────────
function LineBindingForm({ onBind, loading, error }) {
  const [phone, setPhone] = useState('')
  function handleSubmit(e) {
    e.preventDefault()
    if (phone.trim()) onBind(phone.trim())
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔗</div>
          <h2 className="text-xl font-bold text-stone-800">綁定 LINE 帳號</h2>
          <p className="text-sm text-stone-500 mt-1">輸入手機號碼完成一次性綁定</p>
          <p className="text-xs text-stone-400 mt-1">綁定後下次開啟自動登入</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">手機號碼</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="請輸入手機號碼"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              style={{ touchAction: 'manipulation' }} />
          </div>
          {error && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4">{error}</p>}
          <button type="submit" disabled={!phone.trim() || loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40">
            {loading ? '綁定中…' : '完成綁定'}
          </button>
        </form>
        <p className="text-center text-xs text-stone-400 mt-6">還不是會員？請至烏嘎嘎桌遊現場辦理</p>
      </div>
    </div>
  )
}

// ── 生日判斷 ───────────────────────────────────────────────────────────────────
function getBirthdayInfo(birthdayStr) {
  if (!birthdayStr) return null
  const parts = birthdayStr.replace(/-/g, '/').split('/')
  let month, day
  if (parts.length === 3) { month = parseInt(parts[1], 10); day = parseInt(parts[2], 10) }
  else if (parts.length === 2) { month = parseInt(parts[0], 10); day = parseInt(parts[1], 10) }
  else return null
  if (isNaN(month) || isNaN(day)) return null

  const now = new Date()
  for (const yr of [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]) {
    const bday = new Date(yr, month - 1, day)
    const diffDays = Math.round((now - bday) / (1000 * 60 * 60 * 24))
    if (diffDays >= -3 && diffDays <= 3) {
      return {
        inWindow: true,
        isToday: diffDays === 0,
        daysUntil: -diffDays,
        countdown: diffDays === 0
          ? '🎉 今天生日快樂！'
          : diffDays < 0
          ? `還有 ${-diffDays} 天`
          : `${diffDays} 天前`
      }
    }
  }

  // Normal countdown
  const thisYear = now.getFullYear()
  let next = new Date(thisYear, month - 1, day)
  if (next <= now) next = new Date(thisYear + 1, month - 1, day)
  let diffMonths = (next.getFullYear() - now.getFullYear()) * 12 + (next.getMonth() - now.getMonth())
  let tmp = new Date(now); tmp.setMonth(tmp.getMonth() + diffMonths)
  if (tmp > next) { diffMonths--; tmp = new Date(now); tmp.setMonth(tmp.getMonth() + diffMonths) }
  const diffD = Math.ceil((next - tmp) / (1000 * 60 * 60 * 24))
  return { inWindow: false, countdown: `還有 ${diffMonths} 個月 ${diffD} 天` }
}


// ── 會員卡主體 ─────────────────────────────────────────────────────────────────
function MemberCard({ member, onLogout }) {
  const [targetMember, setTargetMember] = useState(null)
  const displayMember = targetMember || member

  const realExp = displayMember.exp || 0
  const [previewLevel, setPreviewLevel] = useState(null)
  const exp = (displayMember.isGM && previewLevel !== null) ? LEVELS[previewLevel].minExp : realExp
  const level = calcLevel(exp)
  const nextLevel = calcNextLevel(exp)
  const progress = nextLevel ? ((exp - level.minExp) / (nextLevel.minExp - level.minExp)) * 100 : 100
  const birthdayInfo = getBirthdayInfo(displayMember.birthday)

  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState({ sessions: [], rentals: [], friendCount: 0 })
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [sessionFriendCount, setSessionFriendCount] = useState(0)
  const [activeRentals, setActiveRentals] = useState([])

  // 玩過/想玩清單
  const [memberGames, setMemberGames] = useState([])
  const [gamesLoaded, setGamesLoaded] = useState(false)
  const [showGames, setShowGames] = useState(false)
  const [gamesTab, setGamesTab] = useState('played')

  // GM 搜尋會員功能
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResults, setSearchResults] = useState([])

  async function handleGMSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setTargetMember(null)
      setSearchResults([])
      setSearchError('')
      return
    }
    setIsSearching(true)
    setSearchError('')
    setSearchResults([])
    const qStr = searchQuery.trim()
    try {
      // 由於 Firebase 不支援多欄位模糊搜尋，且會員數預計不會到極大，
      // 這裡直接抓取全部會員到前端做 filter，這與入場系統的作法一致。
      const snap = await getDocs(collection(db, 'members'))
      const allMembers = snap.docs.map(d => ({ ...d.data(), id: d.id }))
      const matched = allMembers.filter(m => 
        (m.name || '').includes(qStr) || 
        (m.nickname || '').includes(qStr) || 
        (m.phone || '').includes(qStr) || 
        String(m.memberId).includes(qStr)
      )
      
      if (matched.length > 0) {
        // 如果只有一筆，直接顯示
        if (matched.length === 1) {
          setTargetMember(matched[0])
          setSearchQuery('')
        } else {
          setSearchResults(matched)
        }
      } else {
        setSearchError('找不到符合的會員')
      }
    } catch (err) {
      setSearchError('搜尋發生錯誤')
    } finally {
      setIsSearching(false)
    }
  }


  useEffect(() => {
    // 當 displayMember 改變時，重置資料與狀態
    setHistoryLoaded(false)
    setShowHistory(false)
    setGamesLoaded(false)
    setShowGames(false)
    setActiveSession(null)
    setActiveRentals([])
    setSessionFriendCount(0)

    Promise.all([
      getDocs(query(collection(db, 'sessions'), where('memberDocId', '==', displayMember.id), where('status', '==', 'in'))),
      getDocs(query(collection(db, 'rentals'), where('memberDocId', '==', displayMember.id), where('status', '==', 'rented'))),
    ]).then(([sessionSnap, rentalSnap]) => {
      const session = sessionSnap.empty ? null : { id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() }
      setActiveSession(session)
      setActiveRentals(rentalSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      if (session) {
        const prefix = displayMember.name + ' 的朋友'
        getDocs(query(collection(db, 'sessions'), where('status', '==', 'in'), where('name', '>=', prefix), where('name', '<=', prefix + '')))
          .then(snap => setSessionFriendCount(snap.size))
      }
    })
  }, [displayMember.id, displayMember.name])

  async function fetchHistory() {
    if (historyLoaded) { setShowHistory(v => !v); return }
    setHistoryLoading(true); setHistoryError('')
    try {
      const [sessionSnap, rentalSnap] = await Promise.all([
        getDocs(query(collection(db, 'sessions'), where('memberDocId', '==', displayMember.id))),
        getDocs(query(collection(db, 'rentals'), where('memberDocId', '==', displayMember.id))),
      ])
      const sessions = sessionSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      const rentals = rentalSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      let friendCount = 0
      try {
        const prefix = displayMember.name + ' 的朋友'
        const fs = await getDocs(query(collection(db, 'sessions'), where('name', '>=', prefix), where('name', '<=', prefix + '')))
        friendCount = fs.docs.length
      } catch (_) {}
      setHistory({ sessions, rentals, friendCount })
      setHistoryLoaded(true); setShowHistory(true)
    } catch (err) { setHistoryError('無法載入紀錄') }
    finally { setHistoryLoading(false) }
  }

  async function loadGames() {
    if (gamesLoaded) { setShowGames(v => !v); return }
    try {
      const q = query(collection(db, 'member_games'), where('memberId', '==', displayMember.id))
      const snap = await getDocs(q)
      setMemberGames(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setGamesLoaded(true); setShowGames(true)
    } catch (e) { console.error(e) }
  }


  const playedGames = memberGames.filter(g => g.status === 'played')
  const wishGames = memberGames.filter(g => g.status === 'wishlist')


  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      {/* ── GM 搜尋功能 ─────────────────────────────────────────── */}
      {member.isGM && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-500" />
              上帝視角（搜尋會員）
            </h3>
            {targetMember && (
              <button onClick={() => setTargetMember(null)} className="flex items-center gap-1 text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition">
                <X className="w-3 h-3" />
                回到我的帳號
              </button>
            )}
          </div>
          <form onSubmit={handleGMSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="輸入姓名、手機或編號"
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:bg-white transition"
            />
            <button type="submit" disabled={isSearching || !searchQuery.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition shadow-sm shadow-orange-200">
              {isSearching ? '搜尋中' : '搜尋'}
            </button>
          </form>
          {searchError && <p className="text-xs text-red-500 mt-2 ml-1">{searchError}</p>}
          {searchResults.length > 0 && (
            <div className="mt-3 border-t border-stone-100 pt-3 space-y-1.5 max-h-60 overflow-y-auto">
              <p className="text-xs text-stone-400 mb-1">找到 {searchResults.length} 位會員：</p>
              {searchResults.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setTargetMember(m)
                    setSearchResults([])
                    setSearchQuery('')
                  }}
                  className="w-full text-left px-3 py-2 bg-stone-50 hover:bg-orange-50 border border-transparent hover:border-orange-100 rounded-xl transition flex flex-col gap-0.5"
                >
                  <div className="font-medium text-stone-800 text-sm">
                    {m.name} {m.nickname && <span className="text-stone-400 text-xs">（{m.nickname}）</span>}
                  </div>
                  <div className="text-xs text-stone-400 flex items-center gap-1">
                    <span className="font-bold text-orange-400">#{m.memberId}</span>
                    <span>·</span>
                    <span>{m.phone || '無電話'}</span>
                    <span className="ml-auto font-medium text-stone-300">Lv.{calcLevel(m.exp || 0).level}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 生日 Banner ─────────────────────────────────────────── */}
      {birthdayInfo?.inWindow && (
        <div className={`mb-4 rounded-2xl px-4 py-3 border flex items-center gap-3 ${birthdayInfo.isToday ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white border-transparent shadow-lg shadow-orange-200' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
          <span className="text-2xl">{birthdayInfo.isToday ? '🎂' : '🎁'}</span>
          <div>
            <p className="font-bold text-sm">
              {birthdayInfo.isToday
                ? `生日快樂，${displayMember.name}！🎉`
                : birthdayInfo.daysUntil > 0
                ? `生日 ${birthdayInfo.countdown}！壽星優惠準備中 🎊`
                : `壽星優惠還有 ${-birthdayInfo.daysUntil > 0 ? -birthdayInfo.daysUntil : 0} 天截止`}
            </p>
            <p className={`text-xs mt-0.5 ${birthdayInfo.isToday ? 'text-white/80' : 'text-orange-500'}`}>
              生日前後三天入場免費・壽星獨享
            </p>
          </div>
        </div>
      )}

      {/* ── 會員資料卡 ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-lg shadow">
            #{displayMember.memberId}
          </div>
          <div>
            <div className="font-bold text-stone-800 text-lg">{displayMember.name}</div>
            {displayMember.nickname && <div className="text-stone-400 text-sm">（{displayMember.nickname}）</div>}
          </div>
        </div>

        <div className="space-y-2 mb-3 text-base text-stone-600">
          <div className="flex items-center gap-2">
            <span>📱</span><span>手機：{displayMember.phone || '未填寫'}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>🎂</span>
            <span>生日：{displayMember.birthday || '未填寫'}</span>
            {birthdayInfo && !birthdayInfo.inWindow && (
              <span className="text-sm text-orange-500 font-medium">（{birthdayInfo.countdown}）</span>
            )}
          </div>
        </div>
        <p className="text-xs text-stone-400 mb-4">※ 如需更改基本資料請至烏嘎嘎櫃台</p>

        {/* ── GM 等級預覽 ──────────────────────────────────── */}
        {displayMember.isGM && (
          <div className="mb-3">
            <p className="text-xs text-stone-400 mb-1.5">🎮 GM 等級預覽</p>
            <div className="flex gap-1.5 flex-wrap">
              {LEVELS.map((l, i) => (
                <button key={l.level} onClick={() => setPreviewLevel(previewLevel === i ? null : i)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition font-medium ${previewLevel === i ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-stone-500 border-stone-200 hover:border-orange-300'}`}>
                  Lv.{l.level} {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── EXP 進度條（升級版） ─────────────────────────── */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Lv.{level.level}</span>
              <span className="font-bold text-orange-700">{level.name}</span>
            </div>
            <span className="text-sm font-bold text-orange-500">{exp} EXP</span>
          </div>

          {/* 進度條 */}
          <div className="relative h-3 bg-orange-100 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          {/* 里程碑列 */}
          <div className="flex justify-between text-[9px] text-stone-400 mb-2">
            {LEVELS.map(l => (
              <div key={l.level} className={`flex flex-col items-center ${l.level <= level.level ? 'text-orange-400 font-bold' : ''}`}>
                <span>{l.minExp}</span>
                <span>Lv{l.level}</span>
              </div>
            ))}
          </div>

          {nextLevel ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-orange-500">
                再 <strong>{nextLevel.minExp - exp}</strong> EXP 升 Lv.{nextLevel.level}「{nextLevel.name}」
              </p>
              <p className="text-xs text-orange-300">{Math.round(progress)}%</p>
            </div>
          ) : (
            <p className="text-xs text-orange-500 text-center">🏆 已達最高等級 烏嘎嘎傳奇！</p>
          )}
        </div>
      </div>

      {/* ── 購物金 ──────────────────────────────────────────────── */}
      {(displayMember.shoppingCredit > 0) && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <div>
              <span className="font-medium text-stone-700">購物金</span>
              <p className="text-xs text-stone-400">消費時告知店員即可使用</p>
            </div>
          </div>
          <span className="text-xl font-bold text-orange-500">${displayMember.shoppingCredit}</span>
        </div>
      )}


      {/* ── 在場中 ──────────────────────────────────────────────── */}
      {activeSession && (
        <div className="bg-white rounded-3xl shadow-sm border border-green-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
            <span className="text-sm font-bold text-green-600">目前在場中</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-50 rounded-2xl p-3">
              <div className="text-xs text-stone-400 mb-1">入場時間</div>
              <div className="font-medium text-stone-700">
                {activeSession.checkInTime?.seconds
                  ? (() => { const d = new Date(activeSession.checkInTime.seconds * 1000); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` })()
                  : '--'}
              </div>
            </div>
            <div className="bg-green-50 rounded-2xl p-3">
              <div className="text-xs text-stone-400 mb-1">同行朋友</div>
              <div className="font-medium text-stone-700">{sessionFriendCount} 人</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 租借中 ──────────────────────────────────────────────── */}
      {activeRentals.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-5 mb-4">
          <div className="text-sm font-bold text-orange-500 mb-3">📦 租借中的遊戲</div>
          <div className="space-y-3">
            {activeRentals.map(r => {
              const today = new Date().toISOString().slice(0, 10)
              const overdue = r.returnDate && r.returnDate < today
              return (
                <div key={r.id} className={`rounded-2xl p-3 ${overdue ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'}`}>
                  <div className="font-medium text-stone-800 mb-2">{r.gameName || '（未填遊戲名）'}</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="text-stone-500">出租日：<span className="text-stone-700">{r.date}</span></div>
                    <div className={overdue ? 'text-red-500 font-medium' : 'text-stone-500'}>
                      歸還日：<span className={overdue ? 'text-red-500 font-medium' : 'text-stone-700'}>{r.returnDate || '未填寫'}</span>
                      {overdue && ' ⚠️'}
                    </div>
                    <div className="text-stone-500">押金：<span className="text-stone-700">${r.totalPrice || 0}</span></div>
                    <div className="text-stone-500">租金：<span className="text-orange-500 font-bold">${r.amount || 0}</span></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 我的遊戲清單 ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4">
        <button onClick={loadGames} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <span className="font-medium text-stone-700">我的遊戲清單</span>
            {memberGames.length > 0 && (
              <span className="text-xs text-stone-400">({playedGames.length} 玩過 · {wishGames.length} 想玩)</span>
            )}
          </div>
          {showGames ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </button>

        {showGames && (
          <div className="mt-3">
            <div className="flex gap-2 mb-3">
              {['played', 'wishlist'].map(t => (
                <button key={t} onClick={() => setGamesTab(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${gamesTab === t ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {t === 'played' ? `✓ 玩過 (${playedGames.length})` : `♡ 想玩 (${wishGames.length})`}
                </button>
              ))}
            </div>

            {(gamesTab === 'played' ? playedGames : wishGames).length === 0 ? (
              <p className="text-sm text-stone-300 text-center py-4">
                {gamesTab === 'played' ? '還沒有玩過紀錄，在遊戲列表標記吧！' : '願望清單是空的，快去找想玩的遊戲！'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {(gamesTab === 'played' ? playedGames : wishGames).map(g => (
                  <div key={g.id} className="flex items-center justify-between py-1.5 border-b border-stone-50">
                    <span className="text-sm text-stone-700">{g.gameName}</span>
                    {g.rating && (
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-3 h-3 ${i <= g.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 等級福利總覽 ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4">
        <div className="text-sm font-bold text-stone-500 mb-3">等級福利總覽</div>
        <div className="space-y-3">
          {LEVELS.map(l => {
            const unlocked = level.level >= l.level
            return (
              <div key={l.level} className={`rounded-2xl p-3 ${unlocked ? 'bg-orange-50 border border-orange-100' : 'bg-stone-50 border border-stone-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${unlocked ? 'bg-orange-400 text-white' : 'bg-stone-300 text-white'}`}>Lv.{l.level}</span>
                  <span className={`text-sm font-bold ${unlocked ? 'text-orange-700' : 'text-stone-400'}`}>{l.name}</span>
                  <span className="text-xs text-stone-400 ml-auto">{l.minExp} EXP</span>
                </div>
                <div className="space-y-1">
                  {l.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <span className={`mt-0.5 shrink-0 ${unlocked ? 'text-orange-400' : 'text-stone-300'}`}>{unlocked ? '✓' : '🔒'}</span>
                      <span className={unlocked ? 'text-stone-700' : 'text-stone-400'}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 累積 EXP 方式 ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-sm font-bold text-stone-500">如何累積經驗值</div>
          {new Date() < new Date('2026-07-01T00:00:00+08:00') && (
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
              7/1開始正式啟動經驗值系統
            </span>
          )}
        </div>
        <div className="space-y-2">
          {EXP_RULES.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><span>{r.icon}</span><span className="text-stone-600">{r.label}</span></div>
              <span className="font-bold text-orange-500">{r.exp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 消費紀錄 ─────────────────────────────────────────────── */}
      <button onClick={fetchHistory} disabled={historyLoading}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40 mb-3">
        {historyLoading ? '載入中…' : showHistory ? '收起紀錄' : '📋 查看消費紀錄'}
      </button>

      {historyError && <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4 mb-3">{historyError}</p>}

      {showHistory && (
        <div className="space-y-3 mb-4">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="text-sm font-bold text-stone-500 mb-3">入場摘要</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-orange-50 rounded-xl py-3">
                <div className="text-xs text-stone-400 mb-1">總入場次數</div>
                <div className="font-bold text-orange-500 text-lg">{history.sessions.length}</div>
              </div>
              <div className="bg-orange-50 rounded-xl py-3">
                <div className="text-xs text-stone-400 mb-1">最後入場</div>
                <div className="font-bold text-stone-700 text-xs leading-tight pt-1">{history.sessions[0]?.date || '--'}</div>
              </div>
              <div className="bg-orange-50 rounded-xl py-3">
                <div className="text-xs text-stone-400 mb-1">帶過朋友</div>
                <div className="font-bold text-orange-500 text-lg">{history.friendCount}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="text-sm font-bold text-stone-500 mb-3">🎲 購買紀錄</div>
            {(() => {
              const purchases = history.sessions.flatMap(s => (s.purchases || []).map(p => ({ ...p, date: s.date }))).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              return purchases.length === 0
                ? <p className="text-sm text-stone-300 text-center py-2">尚無購買紀錄</p>
                : <div className="space-y-2">{purchases.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div><span className="text-stone-700 font-medium">{p.description || '桌遊購買'}</span><span className="text-stone-400 text-xs ml-2">{p.date}</span></div>
                      <span className="text-orange-500 font-bold">${p.amount}</span>
                    </div>
                  ))}</div>
            })()}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="text-sm font-bold text-stone-500 mb-3">📦 租借紀錄</div>
            {history.rentals.length === 0
              ? <p className="text-sm text-stone-300 text-center py-2">尚無租借紀錄</p>
              : <div className="space-y-2">{history.rentals.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-stone-700 font-medium">{r.gameName || '（未填遊戲名）'}</span>
                      <span className="text-stone-400 text-xs ml-2">{r.date}</span>
                      {r.returnDate && <span className="text-blue-400 text-xs ml-1">還：{r.returnDate}</span>}
                    </div>
                    <span className="text-orange-500 font-bold">${r.amount}</span>
                  </div>
                ))}</div>
            }
          </div>
        </div>
      )}

      <button onClick={onLogout} className="w-full py-3 rounded-2xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition text-sm">
        登出
      </button>

    </div>
  )
}

// ── 主元件 ────────────────────────────────────────────────────────────────────
const MEMBER_KEY = 'ugg_member'

export default function MemberPage({ onMemberChange }) {
  const [member, setMember] = useState(() => {
    try { const s = sessionStorage.getItem(MEMBER_KEY); return s ? JSON.parse(s) : null } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liffChecking, setLiffChecking] = useState(/Line\//.test(navigator.userAgent))
  const [liffUserId, setLiffUserId] = useState(null)
  const [needsBinding, setNeedsBinding] = useState(false)

  function saveMember(data) {
    setMember(data)
    if (onMemberChange) onMemberChange(data)
    if (data) sessionStorage.setItem(MEMBER_KEY, JSON.stringify(data))
    else sessionStorage.removeItem(MEMBER_KEY)
  }

  useEffect(() => {
    if (member) return
    async function checkLiffLogin() {
      try {
        const profile = await getLiffProfile()
        if (!profile) { setLiffChecking(false); return }
        setLiffUserId(profile.userId)
        const q = query(collection(db, 'members'), where('lineUserId', '==', profile.userId))
        const snap = await getDocs(q)
        if (!snap.empty) saveMember({ ...snap.docs[0].data(), id: snap.docs[0].id })
        else setNeedsBinding(true)
      } catch (err) { console.error('LIFF login error:', err) }
      finally { setLiffChecking(false) }
    }
    checkLiffLogin()
  }, [])

  async function handleLineBind(phone) {
    setLoading(true); setError('')
    const normalized = phone.replace(/[\s\-\(\)]/g, '').trim()
    try {
      const snap = await getDocs(collection(db, 'members'))
      const matched = snap.docs.find(d => (d.data().phone || '').replace(/[\s\-\(\)]/g, '').trim() === normalized)
      if (!matched) { setError('找不到此手機號碼的會員，請確認號碼或至現場辦理'); return }
      await updateDoc(doc(db, 'members', matched.id), { lineUserId: liffUserId })
      saveMember({ ...matched.data(), id: matched.id })
    } catch (err) { setError(`綁定失敗：${err?.message || '請稍後再試'}`) }
    finally { setLoading(false) }
  }

  async function handleLogin(name, phone) {
    setLoading(true); setError('')

    // GM 管理員免密碼登入
    if (name === 'GM') {
      try {
        const q = query(collection(db, 'members'), where('name', '==', 'GM'))
        const snap = await getDocs(q)
        if (!snap.empty) {
          saveMember({ ...snap.docs[0].data(), id: snap.docs[0].id })
        } else {
          // Firestore 還沒建 GM 帳號時，用本地預設值
          saveMember(GM_MEMBER)
        }
      } catch {
        saveMember(GM_MEMBER)
      } finally {
        setLoading(false)
      }
      return
    }

    const normalized = phone.replace(/[\s\-\(\)]/g, '').trim()
    try {
      const q = query(collection(db, 'members'), where('name', '==', name))
      const snap = await getDocs(q)

      // 自動建立 Han 的帳號 (最高等級, 編號9999)
      if (name === "Han" && normalized === "0228" && snap.empty) {
        const docRef = await addDoc(collection(db, 'members'), {
          name: "Han",
          phone: "0228",
          memberId: 9999,
          exp: 450,
          level: 5,
          shoppingCredit: 0,
          joinDate: new Date().toISOString().split('T')[0]
        });
        saveMember({ name: "Han", phone: "0228", memberId: 9999, exp: 450, level: 5, shoppingCredit: 0, id: docRef.id });
        setLoading(false);
        return;
      }

      if (snap.empty) { setError('找不到此姓名的會員，請確認姓名是否正確'); return }
      const matched = snap.docs.find(d => (d.data().phone || '').replace(/[\s\-\(\)]/g, '').trim() === normalized)
      if (!matched) setError('手機號碼不符，請確認輸入的號碼')
      else saveMember({ ...matched.data(), id: matched.id })
    } catch (err) { setError(`查詢失敗：${err?.message || '請稍後再試'}`) }
    finally { setLoading(false) }
  }

  if (member) return <MemberCard member={member} onLogout={() => saveMember(null)} />
  if (liffChecking) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-stone-400 text-sm">載入中…</p></div>
  if (needsBinding) return <LineBindingForm onBind={handleLineBind} loading={loading} error={error} />
  return <LoginForm onLogin={handleLogin} loading={loading} error={error} />
}
