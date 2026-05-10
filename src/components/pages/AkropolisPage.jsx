import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

// ── 地區定義 ──────────────────────────────────────────────
const DISTRICTS = [
  {
    key: 'housing',
    label: '🏠 住宅區',
    color: 'blue',
    rule: '只計算最大連通住宅群的方格',
    advancedCondition: '若最大群的基礎分 ≥ 10，得分加倍',
    advancedAuto: true, // 可自動計算
    headerBg: 'bg-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800',
  },
  {
    key: 'market',
    label: '🛒 市場區',
    color: 'yellow',
    rule: '只計算不與其他市場方格相鄰的市場方格',
    advancedCondition: '若市場方格緊鄰對應顏色的廣場，該市場得分加倍',
    advancedAuto: false,
    headerBg: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800',
  },
  {
    key: 'barracks',
    label: '⚔️ 兵營區',
    color: 'red',
    rule: '只計算位於城市外緣（至少一面無鄰接方格）的兵營方格',
    advancedCondition: '若兵營方格有 3~4 個空格相鄰，得分加倍',
    advancedAuto: false,
    headerBg: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
  },
  {
    key: 'temple',
    label: '🏛️ 神廟區',
    color: 'purple',
    rule: '只計算四周完全被方格包圍（無空格相鄰）的神廟方格',
    advancedCondition: '若神廟方格建在較高樓層（2層以上），得分加倍',
    advancedAuto: false,
    headerBg: 'bg-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800',
  },
  {
    key: 'garden',
    label: '🌳 花園區',
    color: 'green',
    rule: '所有花園方格均可計算（無額外條件）',
    advancedCondition: '若花園方格緊鄰「湖泊」（完全被方格包圍的空格），得分加倍',
    advancedAuto: false,
    headerBg: 'bg-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800',
  },
]

const BLANK_DISTRICT = { l1: '', l2: '', l3: '', stars: '', doubled: false }

function makeBlank() {
  return {
    ...Object.fromEntries(DISTRICTS.map(d => [d.key, { ...BLANK_DISTRICT }])),
    stones: '',
  }
}

function districtBase(s, key) {
  return (parseInt(s[key].l1) || 0) + (parseInt(s[key].l2) || 0) * 2 + (parseInt(s[key].l3) || 0) * 3
}

function districtScore(s, key, advanced) {
  const base = districtBase(s, key)
  const stars = parseInt(s[key].stars) || 0
  if (stars === 0) return 0
  const d = DISTRICTS.find(d => d.key === key)
  let doubled = false
  if (advanced) {
    if (d.advancedAuto && key === 'housing') doubled = base >= 10
    else doubled = !!s[key].doubled
  }
  return base * stars * (doubled ? 2 : 1)
}

function calcTotal(s, advanced) {
  const distTotal = DISTRICTS.reduce((sum, d) => sum + districtScore(s, d.key, advanced), 0)
  const stones = parseInt(s.stones) || 0
  return distTotal + stones
}

export default function AkropolisPage({ isLoggedIn, onGoToMember }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(4).fill('').map((_, i) => `玩家${i + 1}`))
  const [scores, setScores] = useState(Array(4).fill(null).map(() => makeBlank()))
  const [active, setActive] = useState(0)
  const [advanced, setAdvanced] = useState(false)

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

  function updateDistrict(pi, key, field, val) {
    setScores(prev => prev.map((s, i) => i !== pi ? s : {
      ...s, [key]: { ...s[key], [field]: val }
    }))
  }

  function updateField(pi, field, val) {
    setScores(prev => prev.map((s, i) => i !== pi ? s : { ...s, [field]: val }))
  }

  const ranked = Array.from({ length: count }, (_, i) => ({
    name: names[i], total: calcTotal(scores[i], advanced), i
  })).sort((a, b) => b.total - a.total)

  if (step === 'setup') return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="bg-gradient-to-b from-sky-700 to-blue-800 rounded-3xl p-5 mb-5 text-center shadow-lg">
        <div className="text-4xl mb-1">🏛️</div>
        <h1 className="text-xl font-black text-white tracking-wide">雅典衛城</h1>
        <p className="text-sky-200 text-xs mt-1">Akropolis · 計分器</p>
      </div>
      <div className="bg-white rounded-2xl border border-blue-200 p-5 space-y-5">

        {/* 規則模式 */}
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">規則模式</label>
          <div className="flex rounded-xl overflow-hidden border border-blue-200">
            <button onClick={() => setAdvanced(false)}
              className={`flex-1 py-2.5 text-sm font-bold transition ${!advanced ? 'bg-blue-700 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              基本規則
            </button>
            <button onClick={() => setAdvanced(true)}
              className={`flex-1 py-2.5 text-sm font-bold transition ${advanced ? 'bg-blue-700 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>
              進階規則
            </button>
          </div>
          {advanced && (
            <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-xl p-2">
              進階規則：各地區符合特定條件時得分加倍
            </p>
          )}
        </div>

        {/* 玩家人數 */}
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

        {/* 玩家名稱 */}
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
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-700 to-blue-800 rounded-2xl px-4 py-3 mb-3 flex items-center justify-between shadow">
        <div>
          <div className="text-white font-black text-base">🏛️ 雅典衛城計分器</div>
          <div className="text-sky-200 text-xs">Akropolis · {advanced ? '進階規則' : '基本規則'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAdvanced(v => !v)}
            className={`text-xs px-2.5 py-1 rounded-lg font-bold transition ${advanced ? 'bg-yellow-400 text-yellow-900' : 'bg-sky-600 text-white'}`}>
            {advanced ? '進階' : '基本'}
          </button>
          <button onClick={() => { setStep('setup'); setScores(Array(4).fill(null).map(() => makeBlank())); setActive(0) }}
            className="text-sky-300 hover:text-white transition"><RotateCcw size={18} /></button>
        </div>
      </div>

      {/* Player Tabs */}
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
          {/* 總分 */}
          <div className="flex items-center justify-between px-1">
            <span className="font-black text-stone-800 text-base">{names[active]}</span>
            <span className="text-2xl font-black text-blue-700">{calcTotal(scores[active], advanced)}</span>
          </div>

          {/* 各地區 */}
          {DISTRICTS.map(d => {
            const s = scores[active]
            const base = districtBase(s, d.key)
            const stars = parseInt(s[d.key].stars) || 0
            const isAutoDoubled = advanced && d.advancedAuto && d.key === 'housing' && base >= 10
            const isManualDoubled = advanced && !d.advancedAuto && !!s[d.key].doubled
            const isDoubled = isAutoDoubled || isManualDoubled
            const score = districtScore(s, d.key, advanced)

            return (
              <div key={d.key} className={`${d.bg} border ${d.border} rounded-xl p-3`}>
                {/* 標題 */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-bold ${d.text}`}>{d.label}</span>
                  <div className="flex items-center gap-1.5">
                    {isDoubled && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-bold">×2</span>}
                    <span className={`text-base font-black ${d.text}`}>{score}</span>
                  </div>
                </div>

                {/* 規則說明 */}
                <div className="text-xs text-stone-500 mb-2">{d.rule}</div>

                {/* 樓層輸入 + 廣場星數 */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { field: 'l1', label: '1樓', sub: '×1' },
                    { field: 'l2', label: '2樓', sub: '×2' },
                    { field: 'l3', label: '3樓', sub: '×3' },
                    { field: 'stars', label: '⭐廣場', sub: '倍率' },
                  ].map(({ field, label, sub }) => (
                    <div key={field} className="text-center">
                      <div className="text-xs text-stone-500">{label}</div>
                      <div className="text-xs text-stone-400">{sub}</div>
                      <input type="number" min="0"
                        value={s[d.key][field]}
                        onChange={e => updateDistrict(active, d.key, field, e.target.value)}
                        className="w-full text-center border border-stone-200 rounded-lg py-1 text-sm focus:outline-none focus:border-blue-400 bg-white"
                        placeholder="0" />
                    </div>
                  ))}
                </div>

                {/* 計算公式 */}
                {stars > 0 && (
                  <div className={`text-xs text-center font-medium ${d.text}`}>
                    ({base}) × {stars}★{isDoubled ? ' × 2' : ''} = {score}
                  </div>
                )}

                {/* 進階規則加倍條件 */}
                {advanced && (
                  <div className={`mt-2 pt-2 border-t ${d.border}`}>
                    <div className="text-xs text-stone-500 mb-1">進階：{d.advancedCondition}</div>
                    {d.advancedAuto ? (
                      <div className={`text-xs font-bold ${isAutoDoubled ? 'text-yellow-600' : 'text-stone-400'}`}>
                        {isAutoDoubled ? `✓ 基礎分 ${base} ≥ 10，自動加倍` : `基礎分 ${base}，未達 10 不加倍`}
                      </div>
                    ) : (
                      <button
                        onClick={() => updateDistrict(active, d.key, 'doubled', !s[d.key].doubled)}
                        className={`text-xs px-3 py-1 rounded-lg font-bold transition ${s[d.key].doubled ? 'bg-yellow-400 text-yellow-900' : 'bg-stone-200 text-stone-500'}`}>
                        {s[d.key].doubled ? '✓ 符合加倍條件' : '不符合加倍條件'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* 剩餘石頭 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-stone-700">🪨 剩餘石頭</div>
                <div className="text-xs text-stone-400">遊戲結束時手邊剩餘的石頭，每塊 +1 分</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="0"
                  value={scores[active].stones}
                  onChange={e => updateField(active, 'stones', e.target.value)}
                  className="w-16 text-center border border-stone-300 rounded-xl py-2 text-sm font-bold focus:outline-none focus:border-blue-400 bg-white"
                  placeholder="0" />
                <span className="text-sm font-bold text-stone-600">分</span>
              </div>
            </div>
          </div>
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
                    <span key={d.key}>{d.label.split(' ')[0]}{districtScore(s, d.key, advanced)}</span>
                  ))}
                  {(parseInt(s.stones) || 0) > 0 && <span>🪨{parseInt(s.stones)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
