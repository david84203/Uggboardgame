import { useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { calcLevel, calcNextLevel, LEVELS } from '../../utils/exp'

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

function getBirthdayCountdown(birthdayStr) {
  if (!birthdayStr) return null
  // 支援 MM/DD 或 YYYY/MM/DD 或 MM-DD 或 YYYY-MM-DD
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
  // 如果今年生日已過，就算明年的
  if (nextBirthday <= now) {
    nextBirthday = new Date(thisYear + 1, month - 1, day)
  }

  // 計算月份與天數差
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
  const [history, setHistory] = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')

  async function fetchHistory() {
    if (historyLoaded) {
      setShowHistory(!showHistory)
      return
    }
    setHistoryLoading(true)
    setHistoryError('')
    try {
      const q = query(
        collection(db, 'sessions'),
        where('memberDocId', '==', member.id)
      )
      const snap = await getDocs(q)
      const records = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      setHistory(records)
      setHistoryLoaded(true)
      setShowHistory(true)
    } catch (err) {
      console.error(err)
      setHistoryError('無法載入消費紀錄')
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

      {/* 已解鎖福利 */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-5 mb-6">
        <div className="text-sm font-bold text-stone-500 mb-3">目前享有福利</div>
        <div className="space-y-2">
          {unlockedBenefits.map((b, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-orange-400 mt-0.5">✓</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 消費紀錄按鈕 */}
      <button
        onClick={fetchHistory}
        disabled={historyLoading}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-sm shadow-orange-200 hover:opacity-90 transition disabled:opacity-40 mb-3"
      >
        {historyLoading ? '載入中…' : showHistory ? '收起消費紀錄' : '📋 查看消費紀錄'}
      </button>

      {historyError && (
        <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2 px-4 mb-3">{historyError}</p>
      )}

      {/* 消費紀錄列表 */}
      {showHistory && (
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-4 mb-4">
          <div className="text-sm font-bold text-stone-500 mb-3">消費紀錄（共 {history.length} 筆）</div>
          {history.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-4">目前沒有消費紀錄</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {history.map(s => {
                const total = (s.finalFee || 0) + (s.foodTotal || 0) + (s.purchaseTotal || 0)
                return (
                  <div key={s.id} className="border border-stone-100 rounded-2xl p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-stone-700 text-sm">📅 {s.date}</span>
                      <span className="font-bold text-orange-500 text-sm">${total}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-xs text-stone-500">
                      <div className="bg-stone-50 rounded-lg py-1.5 text-center">
                        <div className="text-stone-400">入場費</div>
                        <div className="font-medium text-stone-700">${s.finalFee || 0}</div>
                      </div>
                      <div className="bg-stone-50 rounded-lg py-1.5 text-center">
                        <div className="text-stone-400">餐點</div>
                        <div className="font-medium text-stone-700">${s.foodTotal || 0}</div>
                      </div>
                      <div className="bg-stone-50 rounded-lg py-1.5 text-center">
                        <div className="text-stone-400">桌遊購買</div>
                        <div className="font-medium text-stone-700">${s.purchaseTotal || 0}</div>
                      </div>
                    </div>
                    {s.status === 'in' && (
                      <div className="mt-2 text-xs text-orange-500 font-medium text-center">🎮 目前在場中</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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

  function saveMember(data) {
    setMember(data)
    if (onMemberChange) onMemberChange(data)
    if (data) {
      sessionStorage.setItem(MEMBER_KEY, JSON.stringify(data))
    } else {
      sessionStorage.removeItem(MEMBER_KEY)
    }
  }

  async function handleLogin(name, phone) {
    setLoading(true)
    setError('')
    // 格式化手機號碼：去除空格、連字符、括號
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '').trim()
    try {
      // 先用 name 單條件撈，避免複合索引問題
      const q = query(
        collection(db, 'members'),
        where('name', '==', name)
      )
      const snap = await getDocs(q)
      if (snap.empty) {
        setError('找不到此姓名的會員，請確認姓名是否正確')
        return
      }
      // 前端比對 phone（容錯格式）
      const matched = snap.docs.find(doc => {
        const dbPhone = (doc.data().phone || '').replace(/[\s\-\(\)]/g, '').trim()
        return dbPhone === normalizedPhone
      })
      if (!matched) {
        setError('手機號碼不符，請確認輸入的號碼')
      } else {
        saveMember({ id: matched.id, ...matched.data() })
      }
    } catch (err) {
      console.error('Firestore error:', err)
      setError(`查詢失敗：${err?.message || '請稍後再試'}`)
    } finally {
      setLoading(false)
    }
  }

  if (member) {
    return <MemberCard member={member} onLogout={() => saveMember(null)} />
  }

  return <LoginForm onLogin={handleLogin} loading={loading} error={error} />
}
