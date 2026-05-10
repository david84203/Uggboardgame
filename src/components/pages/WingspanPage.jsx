import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

const CATEGORIES = [
  { key: 'birds',   label: '🐦 鳥卡分值',       hint: '每張鳥卡左上角的羽毛數字加總' },
  { key: 'goals',   label: '🎯 回合目標代幣',    hint: '四個回合目標代幣的分數加總' },
  { key: 'bonus',   label: '🃏 獎勵卡',          hint: '獎勵卡的最終得分' },
  { key: 'eggs',    label: '🥚 蛋',              hint: '鳥卡上所有蛋的數量（每顆=1分）' },
  { key: 'food',    label: '🌿 儲糧',            hint: '儲存在鳥卡上的食物數量（每個=1分）' },
  { key: 'tucked',  label: '📋 壓入卡片',        hint: '壓在鳥卡下方的卡片數（每張=1分）' },
]

const BLANK = Object.fromEntries(CATEGORIES.map(c => [c.key, '']))

function calcTotal(s) {
  return CATEGORIES.reduce((sum, c) => sum + (parseInt(s[c.key]) || 0), 0)
}

export default function WingspanPage({ isLoggedIn, onGoToMember }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(5).fill('').map((_, i) => `玩家${i + 1}`))
  const [scores, setScores] = useState(Array(5).fill(null).map(() => ({ ...BLANK })))
  const [active, setActive] = useState(0)

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">🦅</div>
      <h2 className="text-xl font-bold text-emerald-900 mb-2">展翅翱翔計分器</h2>
      <p className="text-stone-400 text-sm mb-6">此功能為會員專屬</p>
      <button onClick={onGoToMember}
        className="px-6 py-2.5 bg-emerald-700 text-white rounded-2xl font-bold text-sm hover:bg-emerald-800">
        前往登入
      </button>
    </div>
  )

  function update(pi, key, val) {
    setScores(prev => prev.map((s, i) => i === pi ? { ...s, [key]: val } : s))
  }

  const ranked = Array.from({ length: count }, (_, i) => ({
    name: names[i], total: calcTotal(scores[i]), i
  })).sort((a, b) => b.total - a.total)

  if (step === 'setup') return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-700 via-emerald-700 to-teal-800 rounded-3xl p-5 mb-5 text-center shadow-lg">
        <div className="text-4xl mb-1">🦅</div>
        <h1 className="text-xl font-black text-white tracking-wide">展翅翱翔</h1>
        <p className="text-sky-200 text-xs mt-1">Wingspan · 計分器</p>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-5">
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家人數</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${count === n ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家名稱</label>
          <div className="space-y-2">
            {Array.from({ length: count }, (_, i) => (
              <input key={i} value={names[i]}
                onChange={e => setNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                className="w-full border border-emerald-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder={`玩家 ${i + 1}`} />
            ))}
          </div>
        </div>
        <button onClick={() => setStep('score')}
          className="w-full py-3 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800">
          開始計分 →
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-700 to-emerald-700 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow">
        <div>
          <div className="text-white font-black text-base">🦅 展翅翱翔計分器</div>
          <div className="text-sky-200 text-xs">Wingspan</div>
        </div>
        <button onClick={() => { setStep('setup'); setScores(Array(5).fill(null).map(() => ({ ...BLANK }))); setActive(0) }}
          className="text-sky-200 hover:text-white transition">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Player Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === i ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {names[i] || `玩家${i + 1}`}
          </button>
        ))}
        <button onClick={() => setActive(-1)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === -1 ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
          排名
        </button>
      </div>

      {active >= 0 ? (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-sky-900 text-base">{names[active]}</span>
            <span className="text-2xl font-black text-emerald-700">{calcTotal(scores[active])}</span>
          </div>
          {CATEGORIES.map(({ key, label, hint }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium text-stone-700">{label}</div>
                <div className="text-xs text-stone-400">{hint}</div>
              </div>
              <input
                type="number" min="0"
                value={scores[active][key]}
                onChange={e => update(active, key, e.target.value)}
                className="w-16 text-center border border-sky-200 rounded-xl py-2 text-sm font-bold focus:outline-none focus:border-emerald-500 bg-white"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-emerald-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-700 to-emerald-700 px-4 py-2.5">
            <span className="text-white font-bold text-sm">🏆 最終排名</span>
          </div>
          {ranked.map((p, rank) => {
            const s = scores[p.i]
            return (
              <div key={p.i} className={`px-4 py-3 border-b border-emerald-50 last:border-0 ${rank === 0 ? 'bg-emerald-50' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`}</span>
                    <span className="font-bold text-stone-800">{p.name}</span>
                  </div>
                  <span className="text-xl font-black text-emerald-700">{p.total}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-400">
                  <span>🐦{parseInt(s.birds)||0}</span>
                  <span>🎯{parseInt(s.goals)||0}</span>
                  <span>🃏{parseInt(s.bonus)||0}</span>
                  <span>🥚{parseInt(s.eggs)||0}</span>
                  <span>🌿{parseInt(s.food)||0}</span>
                  <span>📋{parseInt(s.tucked)||0}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
