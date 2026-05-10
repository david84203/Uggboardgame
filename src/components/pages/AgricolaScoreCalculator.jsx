import React, { useState, useEffect } from 'react';
import { GiWoodenFence, GiWheat, GiCarrot, GiSheep, GiBoar, GiCow, GiHut, GiBrickWall, GiStoneWall, GiMeepleGroup, GiCardPlay, GiRoundStar, GiCardDiscard } from 'react-icons/gi';
import { SquareDashed, Rows4, RotateCcw, BarChart2 } from 'lucide-react';

const SCORE_RULES = {
  fields:     (q) => q <= 1 ? -1 : (q >= 5 ? 4 : q - 1),
  pastures:   (q) => q === 0 ? -1 : (q >= 4 ? 4 : q),
  vegetables: (q) => q === 0 ? -1 : (q >= 4 ? 4 : q),
  grain:      (q) => q === 0 ? -1 : (q >= 8 ? 4 : (q >= 6 ? 3 : (q >= 4 ? 2 : 1))),
  sheep:      (q) => q === 0 ? -1 : (q >= 8 ? 4 : (q >= 6 ? 3 : (q >= 4 ? 2 : 1))),
  boar:       (q) => q === 0 ? -1 : (q >= 7 ? 4 : (q >= 5 ? 3 : (q >= 3 ? 2 : 1))),
  cattle:     (q) => q === 0 ? -1 : (q >= 6 ? 4 : (q >= 4 ? 3 : (q >= 2 ? 2 : 1))),
  stables:    (q) => q * 1,
  unused:     (q) => q * -1,
  clayRooms:  (q) => q * 1,
  stoneRooms: (q) => q * 2,
  family:     (q) => q * 3,
  cards:      (q) => q,
  bonus:      (q) => q,
  begging:    (q) => q * -3,
};

const ICON_STYLE = "text-[2.5rem] shrink-0 text-stone-700/90 drop-shadow-sm";

const ITEMS = [
  { id: 'fields',     icon: <Rows4 className={`w-10 h-10 ${ICON_STYLE}`} strokeWidth={1.5} />, emoji: '🌱', en: 'Fields',          zh: '農田' },
  { id: 'pastures',   icon: <GiWoodenFence className={ICON_STYLE} />,                          emoji: '🏡', en: 'Pastures',         zh: '圈地' },
  { id: 'grain',      icon: <GiWheat className={ICON_STYLE} />,                                emoji: '🌾', en: 'Grain',            zh: '小麥' },
  { id: 'vegetables', icon: <GiCarrot className={ICON_STYLE} />,                               emoji: '🥕', en: 'Vegetables',       zh: '蔬菜' },
  { id: 'sheep',      icon: <GiSheep className={ICON_STYLE} />,                                emoji: '🐑', en: 'Sheep',            zh: '綿羊' },
  { id: 'boar',       icon: <GiBoar className={ICON_STYLE} />,                                 emoji: '🐗', en: 'Wild Boar',        zh: '野豬' },
  { id: 'cattle',     icon: <GiCow className={ICON_STYLE} />,                                  emoji: '🐄', en: 'Cattle',           zh: '牛隻' },
  { id: 'stables',    icon: <GiHut className={ICON_STYLE} />,                                  emoji: '🏠', en: 'Fenced stables',   zh: '圈地內馬廄' },
  { id: 'unused',     icon: <SquareDashed className={`w-10 h-10 ${ICON_STYLE}`} strokeWidth={2.5} />, emoji: '⬜', en: 'Unused spaces', zh: '空地' },
  { id: 'clayRooms',  icon: <GiBrickWall className={ICON_STYLE} />,                            emoji: '🧱', en: 'Clay rooms',       zh: '磚造房間' },
  { id: 'stoneRooms', icon: <GiStoneWall className={ICON_STYLE} />,                            emoji: '🪨', en: 'Stone rooms',      zh: '石造房間' },
  { id: 'family',     icon: <GiMeepleGroup className={ICON_STYLE} />,                          emoji: '👨‍👩‍👧', en: 'Family members',   zh: '家庭成員' },
  { id: 'begging',    icon: <GiCardDiscard className={ICON_STYLE} />,                          emoji: '🤲', en: 'Begging cards',    zh: '乞討卡' },
  { id: 'cards',      icon: <GiCardPlay className={ICON_STYLE} />,                             emoji: '🃏', en: 'Points for cards', zh: '卡牌分數', isDirect: true },
  { id: 'bonus',      icon: <GiRoundStar className={ICON_STYLE} />,                            emoji: '⭐', en: 'Bonus points',     zh: '獎勵分數', isDirect: true },
];

const COLORS = [
  { id: 'white',  label: '白',  bg: 'bg-stone-50',  active: 'bg-white border-b-2 border-stone-800 font-bold',    text: 'text-stone-800',  col: 'text-stone-700',  colBg: 'bg-stone-100' },
  { id: 'purple', label: '紫',  bg: 'bg-purple-50', active: 'bg-purple-100 border-b-2 border-purple-700 font-bold', text: 'text-purple-800', col: 'text-purple-700', colBg: 'bg-purple-100' },
  { id: 'red',    label: '紅',  bg: 'bg-red-50',    active: 'bg-red-100 border-b-2 border-red-700 font-bold',    text: 'text-red-800',    col: 'text-red-700',    colBg: 'bg-red-100' },
  { id: 'blue',   label: '藍',  bg: 'bg-blue-50',   active: 'bg-blue-100 border-b-2 border-blue-700 font-bold',  text: 'text-blue-800',   col: 'text-blue-700',  colBg: 'bg-blue-100' },
  { id: 'green',  label: '綠',  bg: 'bg-green-50',  active: 'bg-green-100 border-b-2 border-green-700 font-bold', text: 'text-green-800',  col: 'text-green-700', colBg: 'bg-green-100' },
];

const DEFAULT_STATE = ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {});
const DEFAULT_PLAYERS = COLORS.reduce((acc, color) => ({
  ...acc,
  [color.id]: { name: '', scores: { ...DEFAULT_STATE } }
}), {});

function calcTotal(scores) {
  return ITEMS.reduce((sum, item) => sum + SCORE_RULES[item.id](scores[item.id]), 0);
}

// ── 結算總表 ─────────────────────────────────────────────
function RankingView({ players }) {
  const playerData = COLORS.map(c => ({
    ...c,
    name: players[c.id].name || c.label,
    scores: players[c.id].scores,
    total: calcTotal(players[c.id].scores),
  }));

  const ranked = [...playerData].sort((a, b) => b.total - a.total);

  return (
    <div className="pb-10">
      {/* 橫向計分表 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: '420px' }}>
          <thead>
            <tr className="bg-[#C8B99A]">
              <th className="px-2 py-2 text-left sticky left-0 bg-[#C8B99A] text-stone-700 font-bold w-20 min-w-[72px] border-r border-[#B0A080]">
                項目
              </th>
              {playerData.map(p => (
                <th key={p.id} className={`px-1 py-2 text-center font-bold ${p.col} min-w-[62px]`}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F2EB]'}>
                <td className={`px-2 py-1.5 sticky left-0 border-r border-stone-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F2EB]'}`}>
                  <div className="flex items-center gap-1">
                    <span>{item.emoji}</span>
                    <span className="text-stone-600 font-medium leading-tight">{item.zh}</span>
                  </div>
                </td>
                {playerData.map(p => {
                  const qty = p.scores[item.id];
                  const score = SCORE_RULES[item.id](qty);
                  const isNeg = score < 0;
                  return (
                    <td key={p.id} className="px-1 py-1.5 text-center">
                      {!item.isDirect && (
                        <span className="text-stone-400 mr-0.5">{qty}</span>
                      )}
                      <span className={`font-bold ${isNeg ? 'text-red-500' : 'text-stone-800'}`}>
                        {score}
                      </span>
                      <span className="text-amber-500 ml-0.5">★</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-stone-800">
              <td className="px-2 py-2 sticky left-0 bg-stone-800 text-white font-black border-r border-stone-600 text-sm">
                總分
              </td>
              {playerData.map((p, i) => {
                const isWinner = p.total === ranked[0].total;
                return (
                  <td key={p.id} className={`px-1 py-2 text-center font-black text-base ${isWinner ? 'text-yellow-300' : 'text-stone-300'}`}>
                    {p.total}
                    <span className="text-amber-400 ml-0.5 text-sm">★</span>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 排名卡片 */}
      <div className="px-4 mt-4 space-y-2">
        <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">最終排名</div>
        {ranked.map((p, rank) => (
          <div key={p.id} className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${p.colBg} border-stone-200`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{['🥇', '🥈', '🥉'][rank] || `${rank + 1}.`}</span>
              <div>
                <div className={`font-bold text-base ${p.col}`}>{p.name}</div>
                <div className="text-xs text-stone-400">
                  {ITEMS.filter(item => {
                    const s = SCORE_RULES[item.id](p.scores[item.id]);
                    return s === 4;
                  }).map(item => item.emoji).join(' ')}
                  {ITEMS.filter(item => SCORE_RULES[item.id](p.scores[item.id]) === 4).length > 0 && ' 滿分'}
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${p.col}`}>{p.total}</span>
              <span className="text-amber-500 text-lg">★</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────────────
export default function AgricolaScoreCalculator() {
  const [activeTab, setActiveTab] = useState('white');
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('agricola_scores');
    if (saved) {
      try { setPlayers(JSON.parse(saved)); } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('agricola_scores', JSON.stringify(players));
  }, [players, isLoaded]);

  const handleNameChange = (e) => {
    setPlayers(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], name: e.target.value } }));
  };

  const handleScoreChange = (id, delta, isDirect) => {
    setPlayers(prev => {
      let newVal = prev[activeTab].scores[id] + delta;
      if (!isDirect && newVal < 0) newVal = 0;
      return { ...prev, [activeTab]: { ...prev[activeTab], scores: { ...prev[activeTab].scores, [id]: newVal } } };
    });
  };

  const handleReset = () => {
    if (window.confirm('確定要將目前這位玩家的分數全部歸零嗎？')) {
      setPlayers(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], scores: { ...DEFAULT_STATE } } }));
    }
  };

  if (!isLoaded) return null;

  const isRanking = activeTab === 'ranking';
  const currentColor = COLORS.find(c => c.id === activeTab);
  const currentScores = isRanking ? null : players[activeTab].scores;
  const currentName   = isRanking ? '' : players[activeTab].name;
  const totalScore    = isRanking ? 0 : calcTotal(currentScores);

  return (
    <div className="max-w-lg mx-auto bg-[#F1EDE3] min-h-screen font-sans pb-10">

      {/* 頂部玩家頁籤 */}
      <div className="flex bg-[#DDD5BC] shadow-sm overflow-x-auto">
        {COLORS.map((color) => (
          <button key={color.id} onClick={() => setActiveTab(color.id)}
            className={`flex-1 py-3 text-center transition-colors text-sm whitespace-nowrap ${
              activeTab === color.id ? color.active : 'text-stone-600 hover:bg-stone-200/50'
            }`}>
            {color.label}
          </button>
        ))}
        <button onClick={() => setActiveTab('ranking')}
          className={`px-4 py-3 flex items-center gap-1 text-sm whitespace-nowrap transition-colors ${
            isRanking ? 'bg-stone-800 text-white font-bold' : 'text-stone-600 hover:bg-stone-200/50'
          }`}>
          <BarChart2 size={15} />排名
        </button>
      </div>

      {/* 結算總表 */}
      {isRanking ? (
        <RankingView players={players} />
      ) : (
        <>
          {/* 資訊摘要區 */}
          <div className="flex items-center justify-between px-6 py-4 bg-[#E8E0CC] border-b border-[#C8BB9A]">
            <div className="flex items-center gap-2 flex-1">
              <span className={`font-medium text-base ${currentColor?.text}`}>名字</span>
              <input type="text" value={currentName} onChange={handleNameChange}
                className="bg-transparent border-b-2 border-teal-600 focus:outline-none w-32 px-1 text-base text-stone-800" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-stone-600 font-bold text-sm">總分</span>
              <span className={`text-4xl font-black ${currentColor?.text}`}>{totalScore}</span>
              <span className="text-amber-500 text-xl">★</span>
            </div>
          </div>

          {/* 計分列表區 */}
          <div className="px-4 py-5 space-y-3">
            {ITEMS.map((item) => {
              const qty = currentScores[item.id];
              const score = SCORE_RULES[item.id](qty);
              const isNeg = score < 0;

              return (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  {/* 圖示與名稱 */}
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <div className="w-10 flex justify-center shrink-0">{item.icon}</div>
                    <span className="text-sm font-bold text-stone-600">{item.zh}</span>
                  </div>

                  {/* 數量調整 */}
                  <div className="flex items-center border-2 border-stone-700 rounded-full bg-white overflow-hidden h-11 w-36 shadow-sm">
                    <button onClick={() => handleScoreChange(item.id, 1, item.isDirect)}
                      className="w-11 h-full flex items-center justify-center text-xl font-bold text-stone-700 hover:bg-stone-100 active:bg-stone-200">+</button>
                    <div className="flex-1 h-full flex items-center justify-center text-xl font-black border-x-2 border-stone-700 bg-stone-50">{qty}</div>
                    <button onClick={() => handleScoreChange(item.id, -1, item.isDirect)}
                      className="w-11 h-full flex items-center justify-center text-xl font-bold text-stone-700 hover:bg-stone-100 active:bg-stone-200">−</button>
                  </div>

                  {/* 分數 */}
                  <div className="w-10 text-right flex items-center justify-end gap-0.5">
                    <span className={`text-lg font-black ${isNeg ? 'text-red-500' : 'text-stone-800'}`}>{score}</span>
                    <span className="text-amber-500 text-sm">★</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部功能區 */}
          <div className="px-4 py-6 flex justify-center">
            <button onClick={handleReset}
              className="flex items-center gap-2 px-8 py-3 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold shadow-sm active:bg-red-100 transition-colors">
              <RotateCcw size={18} /> 一鍵歸零
            </button>
          </div>
        </>
      )}
    </div>
  );
}
