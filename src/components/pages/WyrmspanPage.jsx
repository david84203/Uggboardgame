import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

const CATEGORIES = [
  { key: 'dragons',   label: '🐉 龍卡分值',     hint: '玩家板上所有龍卡印刷的 VP 加總' },
  { key: 'guild',     label: '🏅 公會牌分數',    hint: '公會代幣所達格位的 VP 加總' },
  { key: 'endgame',   label: '✨ 遊戲結束能力',  hint: '龍卡上「遊戲結束」效果的 VP' },
  { key: 'eggs',      label: '🥚 巢穴中的蛋',    hint: '洞穴槽與龍卡上的蛋（每顆=1分）' },
  { key: 'cached',    label: '💎 儲存資源',       hint: '龍卡上儲存的資源（每個=1分）' },
  { key: 'tucked',    label: '🃏 壓入龍卡',       hint: '壓在龍卡下的卡片（每張=1分）' },
  { key: 'coins',     label: '🪙 金幣',            hint: '手邊剩餘的金幣（每枚=1分）' },
  { key: 'others',    label: '📦 其他物品',        hint: '資源+手牌+洞穴卡，每4件=1分', per4: true },
  { key: 'objectives', label: '🎯 公共目標',      hint: '公共目標板上獲得的分數加總' },
]

const BLANK = Object.fromEntries(CATEGORIES.map(c => [c.key, '']))

function calcTotal(s) {
  return CATEGORIES.reduce((sum, c) => {
    const val = parseInt(s[c.key]) || 0
    return sum + (c.per4 ? Math.floor(val / 4) : val)
  }, 0)
}

export default function WyrmspanPage({ isLoggedIn, onGoToMember }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(5).fill('').map((_, i) => `玩家${i + 1}`))
  const [scores, setScores] = useState(Array(5).fill(null).map(() => ({ ...BLANK })))
  const [active, setActive] = useState(0)

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">🐉</div>
      <h2 className="text-xl font-bold text-purple-900 mb-2">龍翼翱翔計分器</h2>
      <p className="text-stone-400 text-sm mb-6">此功能為會員專屬</p>
      <button onClick={onGoToMember}
        className="px-6 py-2.5 bg-purple-700 text-white rounded-2xl font-bold text-sm hover:bg-purple-800">
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
      <div className="bg-gradient-to-br from-purple-900 via-violet-900 to-indigo-900 rounded-3xl p-5 mb-5 text-center shadow-lg">
        <div className="text-4xl mb-1">🐉</div>
        <h1 className="text-xl font-black text-purple-100 tracking-wide">龍翼翱翔</h1>
        <p className="text-purple-400 text-xs mt-1">Wyrmspan · 計分器</p>
      </div>
      <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-5">
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家人數</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${count === n ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>
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
                className="w-full border border-purple-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                placeholder={`玩家 ${i + 1}`} />
            ))}
          </div>
        </div>
        <button onClick={() => setStep('score')}
          className="w-full py-3 bg-purple-700 text-white rounded-2xl font-bold hover:bg-purple-800">
          開始計分 →
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="bg-gradient-to-r from-purple-900 to-violet-900 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow">
        <div>
          <div className="text-purple-100 font-black text-base">🐉 龍翼翱翔計分器</div>
          <div className="text-purple-400 text-xs">Wyrmspan</div>
        </div>
        <button onClick={() => { setStep('setup'); setScores(Array(5).fill(null).map(() => ({ ...BLANK }))); setActive(0) }}
          className="text-purple-400 hover:text-white transition"><RotateCcw size={18} /></button>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === i ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}`}>
            {names[i] || `玩家${i + 1}`}
          </button>
        ))}
        <button onClick={() => setActive(-1)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === -1 ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
          排名
        </button>
      </div>

      {active >= 0 ? (
        <div className="bg-purple-950/90 border border-purple-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-purple-200 text-base">{names[active]}</span>
            <span className="text-2xl font-black text-purple-300">{calcTotal(scores[active])}</span>
          </div>
          {CATEGORIES.map(({ key, label, hint, per4 }) => {
            const raw = parseInt(scores[active][key]) || 0
            const pts = per4 ? Math.floor(raw / 4) : raw
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-100">{label}</div>
                  <div className="text-xs text-purple-400">{hint}</div>
                </div>
                <input type="number" min="0" value={scores[active][key]}
                  onChange={e => update(active, key, e.target.value)}
                  className="w-16 text-center border border-purple-700 rounded-xl py-2 text-sm font-bold focus:outline-none focus:border-purple-400 bg-purple-900 text-purple-100"
                  placeholder="0" />
                {per4 && <span className="text-xs text-purple-400 w-10 text-right shrink-0">={pts}</span>}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-purple-950 border border-purple-800 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 to-violet-900 px-4 py-2.5">
            <span className="text-purple-100 font-bold text-sm">🏆 最終排名</span>
          </div>
          {ranked.map((p, rank) => {
            const s = scores[p.i]
            return (
              <div key={p.i} className={`px-4 py-3 border-b border-purple-900 last:border-0 ${rank === 0 ? 'bg-purple-900/50' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`}</span>
                    <span className="font-bold text-purple-200">{p.name}</span>
                  </div>
                  <span className="text-xl font-black text-purple-300">{p.total}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-purple-500">
                  <span>🐉{parseInt(s.dragons)||0}</span>
                  <span>🏅{parseInt(s.guild)||0}</span>
                  <span>🥚{parseInt(s.eggs)||0}</span>
                  <span>💎{parseInt(s.cached)||0}</span>
                  <span>🃏{parseInt(s.tucked)||0}</span>
                  <span>🪙{parseInt(s.coins)||0}</span>
                  <span>📦{Math.floor((parseInt(s.others)||0)/4)}</span>
                  <span>🎯{parseInt(s.objectives)||0}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
