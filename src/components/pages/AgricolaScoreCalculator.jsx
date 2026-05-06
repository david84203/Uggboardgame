import React, { useState, useEffect } from 'react';
import { GiWoodenFence, GiWheat, GiCarrot, GiSheep, GiBoar, GiCow, GiHut, GiBrickWall, GiStoneWall, GiMeepleGroup, GiCardPlay, GiRoundStar, GiCardDiscard } from 'react-icons/gi';
import { SquareDashed, Rows4, RotateCcw } from 'lucide-react';

const SCORE_RULES = {
  fields: (q) => q <= 1 ? -1 : (q >= 5 ? 4 : q - 1),
  pastures: (q) => q === 0 ? -1 : (q >= 4 ? 4 : q),
  vegetables: (q) => q === 0 ? -1 : (q >= 4 ? 4 : q),
  grain: (q) => q === 0 ? -1 : (q >= 8 ? 4 : (q >= 6 ? 3 : (q >= 4 ? 2 : 1))),
  sheep: (q) => q === 0 ? -1 : (q >= 8 ? 4 : (q >= 6 ? 3 : (q >= 4 ? 2 : 1))),
  boar: (q) => q === 0 ? -1 : (q >= 7 ? 4 : (q >= 5 ? 3 : (q >= 3 ? 2 : 1))),
  cattle: (q) => q === 0 ? -1 : (q >= 6 ? 4 : (q >= 4 ? 3 : (q >= 2 ? 2 : 1))),
  stables: (q) => q * 1,
  unused: (q) => q * -1,
  clayRooms: (q) => q * 1,
  stoneRooms: (q) => q * 2,
  family: (q) => q * 3,
  cards: (q) => q, // 直接加減分數
  bonus: (q) => q, // 直接加減分數
  begging: (q) => q * -3
};

const ICON_STYLE = "text-[2.5rem] shrink-0 text-stone-700/90 drop-shadow-sm";

const ITEMS = [
  { id: 'fields', icon: <Rows4 className={`w-10 h-10 ${ICON_STYLE}`} strokeWidth={1.5} />, en: 'Fields', zh: '農田' },
  { id: 'pastures', icon: <GiWoodenFence className={ICON_STYLE} />, en: 'Pastures', zh: '圈地' },
  { id: 'grain', icon: <GiWheat className={ICON_STYLE} />, en: 'Grain', zh: '麥' },
  { id: 'vegetables', icon: <GiCarrot className={ICON_STYLE} />, en: 'Vegetables', zh: '菜' },
  { id: 'sheep', icon: <GiSheep className={ICON_STYLE} />, en: 'Sheep', zh: '羊' },
  { id: 'boar', icon: <GiBoar className={ICON_STYLE} />, en: 'Wild Boar', zh: '豬' },
  { id: 'cattle', icon: <GiCow className={ICON_STYLE} />, en: 'Cattle', zh: '牛' },
  { id: 'stables', icon: <GiHut className={ICON_STYLE} />, en: 'Fenced stables', zh: '圈地內馬廄' },
  { id: 'unused', icon: <SquareDashed className={`w-10 h-10 ${ICON_STYLE}`} strokeWidth={2.5} />, en: 'Unused spaces', zh: '空地' },
  { id: 'clayRooms', icon: <GiBrickWall className={ICON_STYLE} />, en: 'Clay rooms', zh: '磚屋' },
  { id: 'stoneRooms', icon: <GiStoneWall className={ICON_STYLE} />, en: 'Stone rooms', zh: '石屋' },
  { id: 'family', icon: <GiMeepleGroup className={ICON_STYLE} />, en: 'Family members', zh: '家庭成員' },
  { id: 'cards', icon: <GiCardPlay className={ICON_STYLE} />, en: 'Points for cards', zh: '卡牌分數', isDirect: true },
  { id: 'bonus', icon: <GiRoundStar className={ICON_STYLE} />, en: 'Bonus points', zh: '額外加分', isDirect: true },
  { id: 'begging', icon: <GiCardDiscard className={ICON_STYLE} />, en: 'Begging cards', zh: '乞討卡' }
];

const COLORS = [
  { id: 'white', label: 'White', bg: 'bg-stone-50', active: 'bg-white border-b-2 border-stone-800 font-bold', text: 'text-stone-800' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-50', active: 'bg-purple-100 border-b-2 border-purple-800 font-bold', text: 'text-purple-800' },
  { id: 'red', label: 'Red', bg: 'bg-red-50', active: 'bg-red-100 border-b-2 border-red-800 font-bold', text: 'text-red-800' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-50', active: 'bg-blue-100 border-b-2 border-blue-800 font-bold', text: 'text-blue-800' },
  { id: 'green', label: 'Green', bg: 'bg-green-50', active: 'bg-green-100 border-b-2 border-green-800 font-bold', text: 'text-green-800' }
];

const DEFAULT_STATE = ITEMS.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {});
const DEFAULT_PLAYERS = COLORS.reduce((acc, color) => ({
  ...acc,
  [color.id]: { name: '', scores: { ...DEFAULT_STATE } }
}), {});

export default function AgricolaScoreCalculator() {
  const [activeTab, setActiveTab] = useState('white');
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agricola_scores');
    if (saved) {
      try {
        setPlayers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved scores');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('agricola_scores', JSON.stringify(players));
    }
  }, [players, isLoaded]);

  const handleNameChange = (e) => {
    setPlayers(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], name: e.target.value }
    }));
  };

  const handleScoreChange = (id, delta, isDirect) => {
    setPlayers(prev => {
      const currentVal = prev[activeTab].scores[id];
      let newVal = currentVal + delta;
      
      // Prevent negative quantity unless it's a direct score item (cards/bonus)
      if (!isDirect && newVal < 0) {
        newVal = 0;
      }

      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          scores: {
            ...prev[activeTab].scores,
            [id]: newVal
          }
        }
      };
    });
  };

  const handleReset = () => {
    if (window.confirm('確定要將目前這位玩家的分數全部歸零嗎？')) {
      setPlayers(prev => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], scores: { ...DEFAULT_STATE } }
      }));
    }
  };

  const calculateTotalScore = () => {
    if (!isLoaded) return 0;
    const scores = players[activeTab].scores;
    return ITEMS.reduce((total, item) => {
      return total + SCORE_RULES[item.id](scores[item.id]);
    }, 0);
  };

  if (!isLoaded) return null;

  const currentScores = players[activeTab].scores;
  const currentName = players[activeTab].name;

  return (
    <div className="max-w-lg mx-auto bg-[#F1F1F1] min-h-screen font-sans pb-10">
      {/* 頂部玩家頁籤 */}
      <div className="flex bg-[#E2DCC8] shadow-sm">
        {COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => setActiveTab(color.id)}
            className={`flex-1 py-3 text-center transition-colors ${
              activeTab === color.id ? color.active : 'text-stone-600 hover:bg-stone-200/50'
            }`}
          >
            {color.label}
          </button>
        ))}
      </div>

      {/* 資訊摘要區 */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-200/50 border-b border-stone-300">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-stone-700 font-medium text-lg">Name</span>
          <input
            type="text"
            value={currentName}
            onChange={handleNameChange}
            className="bg-transparent border-b-2 border-teal-600 focus:outline-none w-32 px-1 text-lg text-stone-800"
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-stone-800 font-bold text-lg">Total Score</span>
          <span className="text-4xl font-black text-stone-900">{calculateTotalScore()}</span>
        </div>
      </div>

      {/* 計分列表區 */}
      <div className="px-4 py-6 space-y-4">
        {ITEMS.map((item) => {
          const qty = currentScores[item.id];
          const score = SCORE_RULES[item.id](qty);
          
          return (
            <div key={item.id} className="flex items-center justify-between">
              {/* [左側] 圖示與名稱 */}
              <div className="flex items-center gap-2 w-32 shrink-0 whitespace-nowrap">
                <div className="w-10 flex justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm font-bold text-stone-600">{item.zh}</span>
              </div>

              {/* [中間] 數量調整區 (Pill-shape) */}
              <div className="flex items-center border-2 border-stone-800 rounded-full bg-white overflow-hidden h-12 w-40 shadow-sm">
                <button
                  onClick={() => handleScoreChange(item.id, 1, item.isDirect)}
                  className="w-12 h-full flex items-center justify-center text-2xl font-bold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
                >
                  +
                </button>
                <div className="flex-1 h-full flex items-center justify-center text-2xl font-black border-x-2 border-stone-800 bg-stone-50">
                  {qty}
                </div>
                <button
                  onClick={() => handleScoreChange(item.id, -1, item.isDirect)}
                  className="w-12 h-full flex items-center justify-center text-2xl font-bold text-stone-700 hover:bg-stone-100 active:bg-stone-200"
                >
                  -
                </button>
              </div>

              {/* [右側] 轉換分數 */}
              <div className="w-12 text-right">
                <span className="text-xl text-stone-700">{score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部功能區 */}
      <div className="px-4 py-8 flex justify-center pb-20">
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-8 py-3 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold shadow-sm active:bg-red-100 transition-colors"
        >
          <RotateCcw size={20} />
          一鍵歸零
        </button>
      </div>
    </div>
  );
}
