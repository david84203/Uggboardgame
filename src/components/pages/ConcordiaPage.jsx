import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

// Concordia gods and their scoring rules
const GODS = [
  {
    key: 'vesta',
    name: 'VESTA',
    icon: '🏠',
    label: '灶神 Vesta',
    rule: '將所有貨物換算成金幣後，每10塞斯特爾幣=1分',
    countLabel: '持有塞斯特爾幣（換算後）',
    rate: null, // special: floor(count/10)
    special: 'div10',
    color: 'bg-amber-50 border-amber-200',
    headerColor: 'bg-amber-600',
  },
  {
    key: 'jupiter',
    name: 'JUPITER',
    icon: '⚡',
    label: '天神 Jupiter',
    rule: '每個位於非磚造城市中的商棧=1分（每張卡最多15分）',
    countLabel: '非磚造城市中的商棧數',
    rate: 1,
    color: 'bg-yellow-50 border-yellow-200',
    headerColor: 'bg-yellow-600',
  },
  {
    key: 'saturnus',
    name: 'SATURNUS',
    icon: '🌾',
    label: '農神 Saturnus',
    rule: '每個有至少一個商棧的省份=1分',
    countLabel: '有商棧的省份數',
    rate: 1,
    color: 'bg-lime-50 border-lime-200',
    headerColor: 'bg-lime-700',
  },
  {
    key: 'mercurius',
    name: 'MERCURIUS',
    icon: '⚗️',
    label: '商神 Mercurius',
    rule: '每種有在生產的貨物類型=2分（每張卡最多10分）',
    countLabel: '生產中的貨物類型數',
    rate: 2,
    color: 'bg-teal-50 border-teal-200',
    headerColor: 'bg-teal-700',
  },
  {
    key: 'mars',
    name: 'MARS',
    icon: '🛡️',
    label: '戰神 Mars',
    rule: '棋盤上每個殖民者=2分（每張卡最多12分）',
    countLabel: '棋盤上的殖民者數',
    rate: 2,
    color: 'bg-red-50 border-red-200',
    headerColor: 'bg-red-700',
  },
  {
    key: 'minerva',
    name: 'MINERVA',
    icon: '🦉',
    label: '智慧女神 Minerva',
    rule: '依專家卡的城市類型計分（直接填入每張卡的分數加總）',
    countLabel: '所有 Minerva 卡的分數加總',
    rate: null,
    special: 'direct',
    color: 'bg-blue-50 border-blue-200',
    headerColor: 'bg-blue-700',
  },
]

const BLANK = {
  ...Object.fromEntries(GODS.flatMap(g => [[`${g.key}_cards`, ''], [`${g.key}_count`, '']])),
  concordia: '',
}

function godScore(s, g) {
  const cards = parseInt(s[`${g.key}_cards`]) || 0
  const count = parseInt(s[`${g.key}_count`]) || 0
  if (g.special === 'div10') return cards * Math.floor(count / 10)
  if (g.special === 'direct') return count // Minerva: count is the final score
  return cards * count * g.rate
}

function calcTotal(s) {
  const godsTotal = GODS.reduce((sum, g) => sum + godScore(s, g), 0)
  const concordia = parseInt(s.concordia) > 0 ? 7 : 0
  return godsTotal + concordia
}

export default function ConcordiaPage({ isLoggedIn, onGoToMember }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(5).fill('').map((_, i) => `玩家${i + 1}`))
  const [scores, setScores] = useState(Array(5).fill(null).map(() => ({ ...BLANK })))
  const [active, setActive] = useState(0)

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">🏛️</div>
      <h2 className="text-xl font-bold text-stone-800 mb-2">和諧羅馬計分器</h2>
      <p className="text-stone-400 text-sm mb-6">此功能為會員專屬</p>
      <button onClick={onGoToMember}
        className="px-6 py-2.5 bg-stone-800 text-white rounded-2xl font-bold text-sm hover:bg-stone-900">
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
      <div className="bg-gradient-to-b from-stone-800 to-stone-900 rounded-3xl p-5 mb-5 text-center shadow-lg border border-amber-700">
        <div className="text-4xl mb-1">🏛️</div>
        <h1 className="text-xl font-black text-amber-200 tracking-wide">和諧羅馬</h1>
        <p className="text-stone-400 text-xs mt-1">Concordia · 計分器</p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5">
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家人數</label>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${count === n ? 'bg-stone-800 text-amber-200' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}>
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
                className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                placeholder={`玩家 ${i + 1}`} />
            ))}
          </div>
        </div>
        <button onClick={() => setStep('score')}
          className="w-full py-3 bg-stone-800 text-amber-200 rounded-2xl font-bold hover:bg-stone-900">
          開始計分 →
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="bg-stone-900 border border-amber-700 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow">
        <div>
          <div className="text-amber-200 font-black text-base">🏛️ 和諧羅馬計分器</div>
          <div className="text-stone-500 text-xs">Concordia</div>
        </div>
        <button onClick={() => { setStep('setup'); setScores(Array(5).fill(null).map(() => ({ ...BLANK }))); setActive(0) }}
          className="text-stone-400 hover:text-white transition"><RotateCcw size={18} /></button>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active === i ? 'bg-stone-800 text-amber-200' : 'bg-stone-100 text-stone-700'}`}>
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
            <span className="text-2xl font-black text-amber-700">{calcTotal(scores[active])}</span>
          </div>

          {GODS.map(g => {
            const score = godScore(scores[active], g)
            const cards = parseInt(scores[active][`${g.key}_cards`]) || 0
            const count_ = parseInt(scores[active][`${g.key}_count`]) || 0
            return (
              <div key={g.key} className={`${g.color} border rounded-xl p-3`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-stone-700">{g.icon} {g.label}</span>
                  <span className="text-base font-black text-stone-800">{score}分</span>
                </div>
                <div className="text-xs text-stone-400 mb-2">{g.rule}</div>
                <div className="grid grid-cols-2 gap-2">
                  {g.special !== 'direct' && (
                    <div>
                      <div className="text-xs text-stone-500 mb-1">神明卡張數</div>
                      <input type="number" min="0" value={scores[active][`${g.key}_cards`]}
                        onChange={e => update(active, `${g.key}_cards`, e.target.value)}
                        className="w-full text-center border border-stone-200 rounded-lg py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
                        placeholder="0" />
                    </div>
                  )}
                  <div className={g.special === 'direct' ? 'col-span-2' : ''}>
                    <div className="text-xs text-stone-500 mb-1">{g.countLabel}</div>
                    <input type="number" min="0" value={scores[active][`${g.key}_count`]}
                      onChange={e => update(active, `${g.key}_count`, e.target.value)}
                      className="w-full text-center border border-stone-200 rounded-lg py-1.5 text-sm focus:outline-none focus:border-amber-400 bg-white"
                      placeholder="0" />
                  </div>
                </div>
                {g.special === 'div10' && cards > 0 && count_ > 0 && (
                  <div className="text-xs text-amber-700 text-center mt-1.5 font-medium">
                    {cards}張 × ⌊{count_}÷10⌋ = {score}
                  </div>
                )}
                {g.special !== 'direct' && g.special !== 'div10' && cards > 0 && count_ > 0 && (
                  <div className="text-xs text-amber-700 text-center mt-1.5 font-medium">
                    {cards}張 × {count_} × {g.rate} = {score}
                  </div>
                )}
              </div>
            )
          })}

          {/* Concordia Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-stone-700">📜 Concordia 卡</div>
                <div className="text-xs text-stone-400">若有取得 Concordia 卡，固定+7分</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => update(active, 'concordia', scores[active].concordia ? '' : '1')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${parseInt(scores[active].concordia) > 0 ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-600'}`}>
                  {parseInt(scores[active].concordia) > 0 ? '+7 ✓' : '未取得'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 border border-amber-700 rounded-2xl overflow-hidden">
          <div className="bg-stone-800 px-4 py-2.5 border-b border-amber-800">
            <span className="text-amber-200 font-bold text-sm">🏆 最終排名</span>
          </div>
          {ranked.map((p, rank) => {
            const s = scores[p.i]
            return (
              <div key={p.i} className={`px-4 py-3 border-b border-stone-800 last:border-0 ${rank === 0 ? 'bg-stone-800' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`}</span>
                    <span className="font-bold text-amber-200">{p.name}</span>
                  </div>
                  <span className="text-xl font-black text-amber-400">{p.total}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
                  {GODS.map(g => <span key={g.key}>{g.icon}{godScore(s, g)}</span>)}
                  {parseInt(s.concordia) > 0 && <span>📜7</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
