import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

// 5 district types in Akropolis
const DISTRICTS = [
  {
    key: 'housing',
    label: '🏠 住宅區',
    color: 'blue',
    rule: '最大連通住宅群的所有方格（依樓層×1/2/3分）',
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', header: 'bg-blue-600',
  },
  {
    key: 'market',
    label: '🛒 市場區',
    color: 'yellow',
    rule: '最大連通市場群的所有方格（依樓層×1/2/3分）',
    bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', header: 'bg-yellow-500',
  },
  {
    key: 'barracks',
    label: '⚔️ 兵營區',
    color: 'red',
    rule: '所有緊鄰城市外緣的兵營方格（依樓層×1/2/3分）',
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', header: 'bg-red-600',
  },
  {
    key: 'garden',
    label: '🌳 花園區',
    color: 'green',
    rule: '所有不與其他花園相鄰的花園方格（依樓層×1/2/3分）',
    bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', header: 'bg-green-600',
  },
  {
    key: 'temple',
    label: '🏛️ 神廟區',
    color: 'purple',
    rule: '所有緊鄰採石場的神廟方格（依樓層×1/2/3分）',
    bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', header: 'bg-violet-600',
  },
]

const BLANK = Object.fromEntries(
  DISTRICTS.flatMap(d => [
    [`${d.key}_l1`, ''],
    [`${d.key}_l2`, ''],
    [`${d.key}_l3`, ''],
    [`${d.key}_stars`, ''],
  ])
)

function districtScore(s, key) {
  const l1 = parseInt(s[`${key}_l1`]) || 0
  const l2 = parseInt(s[`${key}_l2`]) || 0
  const l3 = parseInt(s[`${key}_l3`]) || 0
  const stars = parseInt(s[`${key}_stars`]) || 0
  const base = l1 + l2 * 2 + l3 * 3
  return { base, stars, score: base * stars }
}

function calcTotal(s) {
  return DISTRICTS.reduce((sum, d) => sum + districtScore(s, d.key).score, 0)
}

export default function AkropolisPage({ isLoggedIn, onGoToMember }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(4).fill('').map((_, i) => `玩家${i + 1}`))
  const [scores, setScores] = useState(Array(4).fill(null).map(() => ({ ...BLANK })))
  const [active, setActive] = useState(0)

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">🏛️</div>
      <h2 className="text-xl font-bold text-blue-900 mb-2">雅典衛城計分器</h2>
      <p className="text-stone-400 text-sm mb-6">此功能為會員專屬</p>
      <button onClick={onGoToMember}
        className="px-6 py-2.5 bg-blue-700 text-white rounded-2xl font-bold text-sm hover:bg-blue-800">
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
      <div className="bg-gradient-to-b from-sky-700 to-blue-800 rounded-3xl p-5 mb-5 text-center shadow-lg">
        <div className="text-4xl mb-1">🏛️</div>
        <h1 className="text-xl font-black text-white tracking-wide">雅典衛城</h1>
        <p className="text-sky-200 text-xs mt-1">Akropolis · 計分器</p>
        <p className="text-sky-300 text-xs mt-2">請先數好各地區的有效方格數，APP 幫你算乘法</p>
      </div>
      <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-5">
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家人數</label>
          <div className="flex gap-2">
            {[2, 3, 4].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${count === n ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}>
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
                className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder={`玩家 ${i + 1}`} />
            ))}
          </div>
        </div>
        <button onClick={() => setStep('score')}
          className="w-full py-3 bg-blue-700 text-white rounded-2xl font-bold hover:bg-blue-800">
          開始計分 →
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="bg-gradient-to-r from-sky-700 to-blue-800 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow">
        <div>
          <div className="text-white font-black text-base">🏛️ 雅典衛城計分器</div>
          <div className="text-sky-200 text-xs">Akropolis</div>
        </div>
        <button onClick={() => { setStep('setup'); setScores(Array(4).fill(null).map(() => ({ ...BLANK }))); setActive(0) }}
          className="text-sky-300 hover:text-white transition"><RotateCcw size={18} /></button>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === i ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
            {names[i] || `玩家${i + 1}`}
          </button>
        ))}
        <button onClick={() => setActive(-1)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === -1 ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
          排名
        </button>
      </div>

      {active >= 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="font-black text-stone-800 text-base">{names[active]}</span>
            <span className="text-2xl font-black text-blue-700">{calcTotal(scores[active])}</span>
          </div>
          {DISTRICTS.map(d => {
            const { base, stars, score } = districtScore(scores[active], d.key)
            return (
              <div key={d.key} className={`${d.bg} border ${d.border} rounded-xl p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${d.text}`}>{d.label}</span>
                  <span className={`text-base font-black ${d.text}`}>{score}</span>
                </div>
                <div className="text-xs text-stone-400 mb-2">{d.rule}</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { k: `${d.key}_l1`, label: '1層', sub: '×1' },
                    { k: `${d.key}_l2`, label: '2層', sub: '×2' },
                    { k: `${d.key}_l3`, label: '3層', sub: '×3' },
                    { k: `${d.key}_stars`, label: '⭐廣場', sub: '倍率' },
                  ].map(({ k, label, sub }) => (
                    <div key={k} className="text-center">
                      <div className="text-xs text-stone-500">{label}</div>
                      <div className="text-xs text-stone-400">{sub}</div>
                      <input type="number" min="0" value={scores[active][k]}
                        onChange={e => update(active, k, e.target.value)}
                        className="w-full text-center border border-stone-200 rounded-lg py-1 text-sm focus:outline-none focus:border-blue-400 bg-white"
                        placeholder="0" />
                    </div>
                  ))}
                </div>
                {stars > 0 && (
                  <div className={`text-xs text-center mt-1.5 ${d.text} font-medium`}>
                    ({base}) × {stars}星 = {score}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border border-blue-200 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-700 to-blue-800 px-4 py-2.5">
            <span className="text-white font-bold text-sm">🏆 最終排名</span>
          </div>
          {ranked.map((p, rank) => {
            const s = scores[p.i]
            return (
              <div key={p.i} className={`px-4 py-3 border-b border-blue-50 last:border-0 ${rank === 0 ? 'bg-blue-50' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`}</span>
                    <span className="font-bold text-stone-800">{p.name}</span>
                  </div>
                  <span className="text-xl font-black text-blue-700">{p.total}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-400">
                  {DISTRICTS.map(d => (
                    <span key={d.key}>{d.label.split(' ')[0]}{districtScore(s, d.key).score}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
