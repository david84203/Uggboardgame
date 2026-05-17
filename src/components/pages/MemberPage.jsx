import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { calcLevel, calcNextLevel, LEVELS, EXP_RULES } from '../../utils/exp'
import { getLiffProfile } from '../../utils/liff'

function LoginForm({ onLogin, loading, error }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
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
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="請輸入姓名"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              style={{ touchAction: 'manipulation' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">手機號碼</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="請輸入手機號碼"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              style={{ touchAction: 'manipulation' }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || !phone.trim() || loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40"
          >
            {loading ? '查詢中…' : '查詢會員資料'}
          </button>
        </form>
      </div>
    </div>
  )
}

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
          <p className="text-xs text-stone-400 mt-1">綁定後下次開啟自動登入，不用再輸入任何資料</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1.5">手機號碼</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="請輸入手機號碼"
              className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-white text-base text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
              style={{ touchAction: 'manipulation' }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={!phone.trim() || loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-base shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40"
          >
            {loading ? '綁定中…' : '完成綁定'}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-6">還不是會員？請至烏嘎嘎桌遊現場辦理</p>
      </div>
    </div>
  )
}

function getBirthdayCountdown(birthdayStr) {
  if (!birthdayStr) return null
  const parts = birthdayStr.replace(/-/g, '/').split('/')
  let month, day
  if (parts.length === 3) {
    month = parseInt(parts[1], 10)
    day = parseInt(parts[2], 10)
  } else if (parts.length === 2) {
    month = parseInt(parts[0], 10)
    day = parseInt(parts[1], 10)
  } else {
    return null
  }
  if (isNaN(month) || isNaN(day)) return null

  const now = new Date()
  const thisYear = now.getFullYear()
  let nextBirthday = new Date(thisYear, month - 1, day)
  if (nextBirthday <= now) {
    nextBirthday = new Date(thisYear + 1, month - 1, day)
  }

  let diffMonths = (nextBirthday.getFullYear() - now.getFullYear()) * 12 + (nextBirthday.getMonth() - now.getMonth())
  let tempDate = new Date(now)
  tempDate.setMonth(tempDate.getMonth() + diffMonths)
  if (tempDate > nextBirthday) {
    diffMonths--
    tempDate = new Date(now)
    tempDate.setMonth(tempDate.getMonth() + diffMonths)
  }
  const diffDays = Math.ceil((nextBirthday - tempDate) / (1000 * 60 * 60 * 24))

  if (diffMonths === 0 && diffDays === 0) return '🎉 今天生日快樂！'
  return `還有 ${diffMonths} 個月 ${diffDays} 天`
}

function MemberCard({ member, onLogout }) {
  const exp = member.exp || 0
  const level = calcLevel(exp)
  const nextLevel = calcNextLevel(exp)
  const progress = nextLevel
    ? ((exp - level.minExp) / (nextLevel.minExp - level.minExp)) * 100
    : 100
  const unlockedBenefits = LEVELS.filter(l => l.level <= level.level).flatMap(l => l.benefits)
  const birthdayCountdown = getBirthdayCountdown(member.birthday)

  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState({ sessions: [], rentals: [], friendCount: 0 })
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [sessionFriendCount, setSessionFriendCount] = useState(0)
  const [activeRentals, setActiveRentals] = useState([])

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'sessions'), where('memberDocId', '==', member.id), where('status', '==', 'in'))),
      getDocs(query(collection(db, 'rentals'), where('memberDocId', '==', member.id), where('status', '==', 'rented'))),
    ]).then(([sessionSnap, rentalSnap]) => {
      const session = sessionSnap.empty ? null : { id: sessionSnap.docs[0].id, ...sessionSnap.docs[0].data() }
      setActiveSession(session)
      setActiveRentals(rentalSnap.docs.map(d => ({ id: d.id, ...d.data() })))

      if (session) {
        const prefix = member.name + ' 的朋友'
        getDocs(query(
          collection(db, 'sessions'),
          where('status', '==', 'in'),
          where('name', '>=', prefix),
          where('name', '<=', prefix + '')
        )).then(snap => setSessionFriendCount(snap.size))
      }
    })
  }, [member.id, member.name])

  async function fetchHistory() {
    if (historyLoaded) {
      setShowHistory(v => !v)
      return
    }
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const [sessionSnap, rentalSnap] = await Promise.all([
        getDocs(query(collection(db, 'sessions'), where('memberDocId', '==', member.id))),
        getDocs(query(collection(db, 'rentals'), where('memberDocId', '==', member.id))),
      ])

      const sessions = sessionSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

      const rentals = rentalSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

      let friendCount = 0
      try {
        const prefix = member.name + ' 的朋友'
        const friendSnap = await getDocs(query(
          collection(db, 'sessions'),
          where('name', '>=', prefix),
          where('name', '<=', prefix + '')
        ))
        friendCount = friendSnap.docs.length
      } catch (_) {}

      setHistory({ sessions, rentals, friendCount })
      setHistoryLoaded(true)
      setShowHistory(true)
    } catch (err) {
      console.error(err)
      setHistoryError('無法載入紀錄')
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto">
      {/* 頭像 + 基本資料 */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-bold text-lg shadow">
            #{member.memberId}
          </div>
          <div>
            <div className="font-bold text-stone-800 text-lg">{member.name}</div>
            {member.nickname && <div className="text-stone-400 text-sm">（{member.nickname}）</div>}
          </div>
        </div>

        {/* 基本資料 */}
        <div className="space-y-2 mb-3 text-base text-stone-600">
          <div className="flex items-center gap-2">
            <span>📱</span>
            <span>手機：{member.phone || '未填寫'}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>🎂</span>
            <span>生日：{member.birthday || '未填寫'}</span>
            {birthdayCountdown && (
              <span className="text-sm text-orange-500 font-medium">（{birthdayCountdown}）</span>
            )}
          </div>
        </div>
        <p className="text-xs text-stone-400 mb-4">※ 如需更改基本資料請至烏嘎嘎櫃台</p>

        {/* 等級進度 */}
        <div className="bg-orange-50 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-orange-600">Lv.{level.level} {level.name}</span>
            <span className="text-sm text-orange-400">{exp} EXP</span>
          </div>
          <div className="h-2.5 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          {nextLevel ? (
            <div className="text-xs text-orange-400 mt-1.5 text-right">
              距 Lv.{nextLevel.level}「{nextLevel.name}」還差 {nextLevel.minExp - exp} EXP
            </div>
          ) : (
            <div className="text-xs text-orange-400 mt-1.5 text-right">已達最高等級 🎉</div>
          )}
        </div>
      </div>

      {/* 購物金 */}
      {(member.shoppingCredit > 0) && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛍️</span>
            <span className="font-medium text-stone-700">購物金</span>
          </div>
          <span className="text-xl font-bold text-orange-500">${member.shoppingCredit}</span>
        </div>
      )}

      {/* 目前在場中 */}
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
                  ? (() => {
                      const d = new Date(activeSession.checkInTime.seconds * 1000)
                      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
                    })()
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

      {/* 租借中的遊戲 */}
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

      {/* 等級福利總覽 */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-4">
        <div className="text-sm font-bold text-stone-500 mb-3">等級福利總覽</div>
        <div className="space-y-3">
          {LEVELS.map(l => {
            const unlocked = level.level >= l.level
            return (
              <div key={l.level} className={`rounded-2xl p-3 ${unlocked ? 'bg-orange-50 border border-orange-100' : 'bg-stone-50 border border-stone-100'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${unlocked ? 'bg-orange-400 text-white' : 'bg-stone-300 text-white'}`}>
                    Lv.{l.level}
                  </span>
                  <span className={`text-sm font-bold ${unlocked ? 'text-orange-700' : 'text-stone-400'}`}>{l.name}</span>
                  <span className="text-xs text-stone-400 ml-auto">{l.minExp} EXP</span>
                </div>
                <div className="space-y-1">
                  {l.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <span className={`mt-0.5 shrink-0 ${unlocked ? 'text-orange-400' : 'text-stone-300'}`}>
                        {unlocked ? '✓' : '🔒'}
                      </span>
                      <span className={unlocked ? 'text-stone-700' : 'text-stone-400'}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 如何累積經驗值 */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-6">
        <div className="text-sm font-bold text-stone-500 mb-3">如何累積經驗值</div>
        <div className="space-y-2">
          {EXP_RULES.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>{r.icon}</span>
                <span className="text-stone-600">{r.label}</span>
              </div>
              <span className="font-bold text-orange-500">{r.exp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 紀錄按鈕 */}
      <button
        onClick={fetchHistory}
        disabled={historyLoading}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40 mb-3"
      >
        {historyLoading ? '載入中…' : showHistory ? '收起紀錄' : '📋 查看紀錄'}
      </button>

      {historyError && (
        <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4 mb-3">{historyError}</p>
      )}

      {showHistory && (
        <div className="space-y-3 mb-4">

          {/* 入場摘要 */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="text-sm font-bold text-stone-500 mb-3">入場摘要</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-orange-50 rounded-xl py-3">
                <div className="text-xs text-stone-400 mb-1">總入場次數</div>
                <div className="font-bold text-orange-500 text-lg">{history.sessions.length}</div>
              </div>
              <div className="bg-orange-50 rounded-xl py-3">
                <div className="text-xs text-stone-400 mb-1">最後入場</div>
                <div className="font-bold text-stone-700 text-xs leading-tight pt-1">
                  {history.sessions[0]?.date || '--'}
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl py-3">
                <div className="text-xs text-stone-400 mb-1">帶過朋友</div>
                <div className="font-bold text-orange-500 text-lg">{history.friendCount}</div>
              </div>
            </div>
          </div>

          {/* 購買紀錄 */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="text-sm font-bold text-stone-500 mb-3">🎲 購買紀錄</div>
            {(() => {
              const purchases = history.sessions
                .flatMap(s => (s.purchases || []).map(p => ({ ...p, date: s.date })))
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
              return purchases.length === 0 ? (
                <p className="text-sm text-stone-300 text-center py-2">尚無購買紀錄</p>
              ) : (
                <div className="space-y-2">
                  {purchases.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-stone-700 font-medium">{p.description || '桌遊購買'}</span>
                        <span className="text-stone-400 text-xs ml-2">{p.date}</span>
                      </div>
                      <span className="text-orange-500 font-bold">${p.amount}</span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* 租借紀錄 */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <div className="text-sm font-bold text-stone-500 mb-3">📦 租借紀錄</div>
            {history.rentals.length === 0 ? (
              <p className="text-sm text-stone-300 text-center py-2">尚無租借紀錄</p>
            ) : (
              <div className="space-y-2">
                {history.rentals.map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-stone-700 font-medium">{r.gameName || '（未填遊戲名）'}</span>
                      <span className="text-stone-400 text-xs ml-2">{r.date}</span>
                      {r.returnDate && (
                        <span className="text-blue-400 text-xs ml-1">還：{r.returnDate}</span>
                      )}
                    </div>
                    <span className="text-orange-500 font-bold">${r.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      <button
        onClick={onLogout}
        className="w-full py-3 rounded-2xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition text-sm"
      >
        登出
      </button>
    </div>
  )
}

const MEMBER_KEY = 'ugg_member'

export default function MemberPage({ onMemberChange }) {
  const [member, setMember] = useState(() => {
    try {
      const saved = sessionStorage.getItem(MEMBER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liffChecking, setLiffChecking] = useState(/Line\//.test(navigator.userAgent))
  const [liffUserId, setLiffUserId] = useState(null)
  const [needsBinding, setNeedsBinding] = useState(false)

  function saveMember(data) {
    setMember(data)
    if (onMemberChange) onMemberChange(data)
    if (data) {
      sessionStorage.setItem(MEMBER_KEY, JSON.stringify(data))
    } else {
      sessionStorage.removeItem(MEMBER_KEY)
    }
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
        if (!snap.empty) {
          saveMember({ ...snap.docs[0].data(), id: snap.docs[0].id })
        } else {
          setNeedsBinding(true)
        }
      } catch (err) {
        console.error('LIFF login error:', err)
      } finally {
        setLiffChecking(false)
      }
    }
    checkLiffLogin()
  }, [])

  async function handleLineBind(phone) {
    setLoading(true)
    setError('')
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').trim()
    try {
      const allSnap = await getDocs(collection(db, 'members'))
      const matched = allSnap.docs.find(d => {
        const dbPhone = (d.data().phone || '').replace(/[\s\-\(\)]/g, '').trim()
        return dbPhone === normalizedPhone
      })
      if (!matched) {
        setError('找不到此手機號碼的會員，請確認號碼或至現場辦理')
        return
      }
      await updateDoc(doc(db, 'members', matched.id), { lineUserId: liffUserId })
      saveMember({ ...matched.data(), id: matched.id })
    } catch (err) {
      console.error('Binding error:', err)
      setError(`綁定失敗：${err?.message || '請稍後再試'}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(name, phone) {
    setLoading(true)
    setError('')
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').trim()
    try {
      const q = query(collection(db, 'members'), where('name', '==', name))
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('找不到此姓名的會員，請確認姓名是否正確')
        return
      }
      const matched = snap.docs.find(doc => {
        const dbPhone = (doc.data().phone || '').replace(/[\s\-\(\)]/g, '').trim()
        return dbPhone === normalizedPhone
      })
      if (!matched) {
        setError('手機號碼不符，請確認輸入的號碼')
      } else {
        saveMember({ ...matched.data(), id: matched.id })
      }
    } catch (err) {
      console.error('Firestore error:', err)
      setError(`查詢失敗：${err?.message || '請稍後再試'}`)
    } finally {
      setLoading(false)
    }
  }

  if (member) return <MemberCard member={member} onLogout={() => saveMember(null)} />

  if (liffChecking) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-stone-400 text-sm">載入中…</p>
    </div>
  )

  if (needsBinding) return <LineBindingForm onBind={handleLineBind} loading={loading} error={error} />

  return <LoginForm onLogin={handleLogin} loading={loading} error={error} />
}
