import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

// ── Science wildcard optimization ──
function calcScience(compass, gear, tablet, wildcards) {
  let best = 0
  const wc = Math.max(0, wildcards)
  for (let a = 0; a <= wc; a++) {
    for (let b = 0; b <= wc - a; b++) {
      const c = wc - a - b
      const x = compass + a, y = gear + b, z = tablet + c
      best = Math.max(best, x * x + y * y + z * z + 7 * Math.min(x, y, z))
    }
  }
  return best
}

function calcTotal(s) {
  const military = parseInt(s.military) || 0
  const treasury = Math.floor((parseInt(s.coins) || 0) / 3)
  const wonders  = parseInt(s.wonders)  || 0
  const civilian = parseInt(s.civilian) || 0
  const commercial = parseInt(s.commercial) || 0
  const guilds   = parseInt(s.guilds)   || 0
  const science  = calcScience(
    parseInt(s.compass) || 0,
    parseInt(s.gear)    || 0,
    parseInt(s.tablet)  || 0,
    parseInt(s.wildcards) || 0
  )
  return { military, treasury, wonders, civilian, commercial, guilds, science,
    total: military + treasury + wonders + civilian + commercial + guilds + science }
}

const BLANK = { military:'', coins:'', wonders:'', civilian:'', commercial:'', guilds:'',
  compass:'', gear:'', tablet:'', wildcards:'' }

const NUM_IN = 'w-full text-center border border-amber-200 rounded-lg py-1.5 text-sm focus:outline-none focus:border-amber-500 bg-amber-50/60'
const NUM_IN_DARK = 'w-full text-center border border-stone-300 rounded-lg py-1.5 text-sm focus:outline-none focus:border-amber-500 bg-white'

function n(v) { return parseInt(v) || 0 }

function Row({ label, children, score, signed }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-stone-600 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
      <span className={`w-8 text-right text-sm font-bold shrink-0 ${signed && score < 0 ? 'text-red-500' : 'text-amber-700'}`}>
        {score > 0 && !signed ? score : score === 0 ? '0' : score}
      </span>
    </div>
  )
}

function PlayerPanel({ name, s, onChange }) {
  const c = calcTotal(s)
  const compass = n(s.compass), gear = n(s.gear), tablet = n(s.tablet)

  return (
    <div className="space-y-2">
      {/* Military */}
      <Row label="⚔️ 軍事衝突" score={c.military} signed>
        <input type="number" value={s.military} onChange={e=>onChange('military',e.target.value)}
          className={NUM_IN_DARK} placeholder="可為負" />
      </Row>
      {/* Treasury */}
      <Row label="🪙 金幣" score={c.treasury}>
        <input type="number" min="0" value={s.coins} onChange={e=>onChange('coins',e.target.value)}
          className={NUM_IN_DARK} placeholder="金幣數量" />
      </Row>
      {/* Wonders */}
      <Row label="🏛️ 奇蹟" score={c.wonders}>
        <input type="number" min="0" value={s.wonders} onChange={e=>onChange('wonders',e.target.value)}
          className={NUM_IN_DARK} placeholder="0" />
      </Row>
      {/* Civilian */}
      <Row label="🟦 民用建築" score={c.civilian}>
        <input type="number" min="0" value={s.civilian} onChange={e=>onChange('civilian',e.target.value)}
          className={NUM_IN_DARK} placeholder="0" />
      </Row>
      {/* Commercial */}
      <Row label="🟨 商業建築" score={c.commercial}>
        <input type="number" min="0" value={s.commercial} onChange={e=>onChange('commercial',e.target.value)}
          className={NUM_IN_DARK} placeholder="0" />
      </Row>
      {/* Guilds */}
      <Row label="🟪 公會" score={c.guilds}>
        <input type="number" min="0" value={s.guilds} onChange={e=>onChange('guilds',e.target.value)}
          className={NUM_IN_DARK} placeholder="0" />
      </Row>

      {/* Science */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-emerald-800">🔬 科學建築</span>
          <span className="text-base font-black text-emerald-700">{c.science} 分</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { k:'compass', label:'🧭', sub:'羅盤' },
            { k:'gear',    label:'⚙️', sub:'齒輪' },
            { k:'tablet',  label:'📜', sub:'石板' },
            { k:'wildcards',label:'🃏', sub:'萬用' },
          ].map(({ k, label, sub }) => (
            <div key={k} className="text-center">
              <div className="text-xs text-stone-500 mb-0.5">{label} {sub}</div>
              <input type="number" min="0" value={s[k]} onChange={e=>onChange(k,e.target.value)}
                className={NUM_IN} placeholder="0" />
            </div>
          ))}
        </div>
        <div className="text-xs text-center text-emerald-700 font-medium">
          {compass}²+{gear}²+{tablet}² + 7×{Math.min(compass,gear,tablet)}
          {' = '}{compass*compass+gear*gear+tablet*tablet+7*Math.min(compass,gear,tablet)}
          {n(s.wildcards) > 0 && <span className="text-amber-600"> (含 {n(s.wildcards)} 張萬用牌最佳化)</span>}
        </div>
      </div>
    </div>
  )
}

export default function SevenWondersPage({ isLoggedIn, onGoToMember }) {
  const [step, setStep] = useState('setup')
  const [count, setCount] = useState(3)
  const [names, setNames] = useState(Array(7).fill('').map((_,i)=>`玩家${i+1}`))
  const [scores, setScores] = useState(Array(7).fill(null).map(()=>({...BLANK})))
  const [active, setActive] = useState(0)

  if (!isLoggedIn) return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] px-6 text-center">
      <div className="text-6xl mb-4">🏛️</div>
      <h2 className="text-xl font-bold text-amber-900 mb-2">七大奇蹟計分器</h2>
      <p className="text-stone-400 text-sm mb-6">此功能為會員專屬</p>
      <button onClick={onGoToMember}
        className="px-6 py-2.5 bg-amber-600 text-white rounded-2xl font-bold text-sm hover:bg-amber-700">
        前往登入
      </button>
    </div>
  )

  function updateScore(pi, key, val) {
    setScores(prev => prev.map((s, i) => i === pi ? { ...s, [key]: val } : s))
  }

  const ranked = Array.from({ length: count }, (_, i) => ({
    name: names[i], total: calcTotal(scores[i]).total, i
  })).sort((a, b) => b.total - a.total)

  if (step === 'setup') return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-800 to-amber-900 rounded-3xl p-5 mb-5 text-center shadow-lg">
        <div className="text-4xl mb-1">🏛️</div>
        <h1 className="text-xl font-black text-amber-100 tracking-wide">七大奇蹟</h1>
        <p className="text-amber-300 text-xs mt-1">Seven Wonders · 計分器</p>
      </div>

      <div className="bg-white rounded-2xl border border-amber-200 p-5 space-y-5">
        <div>
          <label className="text-sm font-bold text-stone-600 block mb-2">玩家人數</label>
          <div className="flex gap-2 flex-wrap">
            {[2,3,4,5,6,7].map(n => (
              <button key={n} onClick={()=>setCount(n)}
                className={`w-10 h-10 rounded-xl font-bold text-sm transition ${count===n ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}>
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
                onChange={e=>setNames(prev=>prev.map((n,j)=>j===i?e.target.value:n))}
                className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                placeholder={`玩家 ${i+1}`} />
            ))}
          </div>
        </div>
        <button onClick={()=>setStep('score')}
          className="w-full py-3 bg-amber-700 text-white rounded-2xl font-bold hover:bg-amber-800">
          開始計分 →
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-amber-800 to-amber-900 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between shadow">
        <div>
          <div className="text-amber-100 font-black text-base">🏛️ 七大奇蹟計分器</div>
          <div className="text-amber-400 text-xs">Seven Wonders</div>
        </div>
        <button onClick={()=>{setStep('setup');setScores(Array(7).fill(null).map(()=>({...BLANK})));setActive(0)}}
          className="text-amber-300 hover:text-white transition">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Player Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={()=>setActive(i)}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active===i ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
            {names[i] || `玩家${i+1}`}
          </button>
        ))}
        <button onClick={()=>setActive(-1)}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition ${active===-1 ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600'}`}>
          排名
        </button>
      </div>

      {active >= 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-amber-900 text-base">{names[active]}</span>
            <span className="text-2xl font-black text-amber-700">{calcTotal(scores[active]).total}</span>
          </div>
          <PlayerPanel name={names[active]} s={scores[active]} onChange={(k,v)=>updateScore(active,k,v)} />
        </div>
      ) : (
        <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden">
          <div className="bg-amber-800 px-4 py-2.5">
            <span className="text-amber-100 font-bold text-sm">🏆 最終排名</span>
          </div>
          {ranked.map((p, rank) => {
            const d = calcTotal(scores[p.i])
            return (
              <div key={p.i} className={`px-4 py-3 border-b border-amber-100 last:border-0 ${rank===0?'bg-amber-50':''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{['🥇','🥈','🥉'][rank]||`${rank+1}.`}</span>
                    <span className="font-bold text-stone-800">{p.name}</span>
                  </div>
                  <span className="text-xl font-black text-amber-700">{p.total}</span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-400">
                  <span>⚔️{d.military}</span>
                  <span>🪙{d.treasury}</span>
                  <span>🏛️{d.wonders}</span>
                  <span>🟦{d.civilian}</span>
                  <span>🟨{d.commercial}</span>
                  <span>🟪{d.guilds}</span>
                  <span>🔬{d.science}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
