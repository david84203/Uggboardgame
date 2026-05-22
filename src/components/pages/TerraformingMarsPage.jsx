import { useState } from 'react'
import { RotateCcw, Upload } from 'lucide-react'
import ScoreUploadModal from '../ScoreUploadModal'

const CATEGORIES = [
  { key: 'tr',         label: '🌍 地球化評級 (TR)', hint: '遊戲結束時的 TR 軌道數值' },
  { key: 'milestones', label: '🎖️ 里程碑數量',      hint: '宣告的里程碑數（每個 ×5分）', multiplier: 5 },
  { key: 'awards',     label: '🏆 獎項分數',         hint: '第一名 5 分 / 第二名 2 分（填加總）' },
  { key: 'greenery',   label: '🌲 綠地板塊',         hint: '自己的綠地板塊數量（每塊 ×1分）' },
  { key: 'cities',     label: '🏙️ 城市鄰接分',      hint: '每個城市鄰接的綠地數（任何人的綠地）' },
  { key: 'cards',      label: '🃏 卡片分數',          hint: '手中所有已出牌的 VP 符號加總' },
]

const BLANK = Object.fromEntries(CATEGORIES.map(c => [c.key, '']))

function calcTotal(s) {
  return CATEGORIES.reduce((sum, c) => {
    const val = parseInt(s[c.key]) || 0
    return sum + (c.multiplier ? val * c.multiplier : val)
  }, 0)
}

function calcBreakdown(s) {
  return Object.fromEntries(CATEGORIES.map(c => {
    const val = parseInt(s[c.key]) || 0
    return [c.key, c.multiplier ? val * c.multiplier : val]
  }))
}

export default function TerraformingMarsPage({ isLoggedIn, onGoToMember, games }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(5).fill('').map((_, i) => `玩家${i + 1}`))
  const [scores, setScores] = useState(Array(5).fill(null).map(() => ({ ...BLANK })))
  const [active, setActive] = useState(0)
  const [showUpload, setShowUpload] = useState(false)

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">🪐</div>
      <h2 className="text-xl font-bold text-red-900 mb-2">殖民火星計分器</h2>
      <p className="text-stone-400 text-sm mb-6">此功能為會員專屬</p>
      <button onClick={onGoToMember}
        className="px-6 py-2.5 bg-red-700 text-white rounded-2xl font-bold text-sm hover:bg-red-800">
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
      <div className="bg-gradient-to-br from-stone-900 via-red-950 to-orange-950 rounded-3xl p-5 mb-5 text-center shadow-lg">
        <div className="text-4xl mb-1">🪐</div>
        <h1 className="text-xl font-black text-orange-200 tracking-wide">殖民火星</h1>
        <p className="text-red-400 text-xs mt-1">Terraforming Mars · 計分器</p>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-5">
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家人數</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${count === n ? 'bg-red-700 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'}`}>
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
                className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                placeholder={`玩家 ${i + 1}`} />
            ))}
          </div>
        </div>
        <button onClick={() => setStep('score')}
          className="w-full py-3 bg-red-700 text-white rounded-2xl font-bold hover:bg-red-800">
          開始計分 →
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 to-red-900 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow">
        <div>
          <div className="text-orange-200 font-black text-base">🪐 殖民火星計分器</div>
          <div className="text-red-400 text-xs">Terraforming Mars</div>
        </div>
        <button onClick={() => { setStep('setup'); setScores(Array(5).fill(null).map(() => ({ ...BLANK }))); setActive(0) }}
          className="text-red-400 hover:text-white transition">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Player Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === i ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'}`}>
            {names[i] || `玩家${i + 1}`}
          </button>
        ))}
        <button onClick={() => setActive(-1)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === -1 ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
          排名
        </button>
      </div>

      {active >= 0 ? (
        <div className="bg-stone-900 border border-red-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-orange-200 text-base">{names[active]}</span>
            <span className="text-2xl font-black text-orange-400">{calcTotal(scores[active])}</span>
          </div>
          {CATEGORIES.map(({ key, label, hint, multiplier }) => {
            const raw = parseInt(scores[active][key]) || 0
            const pts = multiplier ? raw * multiplier : raw
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-stone-200">{label}</div>
                  <div className="text-xs text-stone-500">{hint}</div>
                </div>
                <input
                  type="number" min="0"
                  value={scores[active][key]}
                  onChange={e => update(active, key, e.target.value)}
                  className="w-16 text-center border border-red-800 rounded-xl py-2 text-sm font-bold focus:outline-none focus:border-orange-500 bg-stone-800 text-orange-200"
                  placeholder="0"
                />
                {multiplier && (
                  <span className="text-xs text-orange-400 w-12 text-right shrink-0">
                    ×{multiplier}={pts}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          <div className="bg-stone-900 border border-red-900 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-stone-900 to-red-900 px-4 py-2.5">
              <span className="text-orange-200 font-bold text-sm">🏆 最終排名</span>
            </div>
            {ranked.map((p, rank) => {
              const d = calcBreakdown(scores[p.i])
              return (
                <div key={p.i} className={`px-4 py-3 border-b border-red-950 last:border-0 ${rank === 0 ? 'bg-red-950/40' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`}</span>
                      <span className="font-bold text-orange-200">{p.name}</span>
                    </div>
                    <span className="text-xl font-black text-orange-400">{p.total}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
                    <span>🌍TR:{d.tr}</span>
                    <span>🎖️{d.milestones}</span>
                    <span>🏆{d.awards}</span>
                    <span>🌲{d.greenery}</span>
                    <span>🏙️{d.cities}</span>
                    <span>🃏{d.cards}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => setShowUpload(true)}
            className="w-full mt-3 py-2.5 bg-amber-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600">
            <Upload size={15} />上傳計分卡到排行榜
          </button>
        </div>
      )}
      {showUpload && (
        <ScoreUploadModal
          result={{
            players: Array.from({ length: count }, (_, i) => ({
              name: names[i] || `玩家${i + 1}`,
              total: calcTotal(scores[i]),
              categories: Object.fromEntries(CATEGORIES.map(c => {
                const val = parseInt(scores[i][c.key]) || 0
                return [c.label.replace(/^.*?\s/, ''), c.multiplier ? val * c.multiplier : val]
              })),
            })),
            source: 'terraforming',
          }}
          games={games}
          defaultGameName="殖民火星"
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}
