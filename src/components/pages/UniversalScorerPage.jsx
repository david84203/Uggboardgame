import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RotateCcw, Undo2, CornerDownLeft, RotateCw } from 'lucide-react';

// ── 顏色系統 ──────────────────────────────────────
const PALETTE = {
  red:     { bg:'#ef4444', border:'#dc2626', text:'#fff',     light:'#fef2f2', name:'紅' },
  orange:  { bg:'#f97316', border:'#ea580c', text:'#fff',     light:'#fff7ed', name:'橙' },
  yellow:  { bg:'#eab308', border:'#ca8a04', text:'#1c1917',  light:'#fefce8', name:'黃' },
  green:   { bg:'#22c55e', border:'#16a34a', text:'#fff',     light:'#f0fdf4', name:'綠' },
  blue:    { bg:'#3b82f6', border:'#2563eb', text:'#fff',     light:'#eff6ff', name:'藍' },
  purple:  { bg:'#a855f7', border:'#9333ea', text:'#fff',     light:'#faf5ff', name:'紫' },
  pink:    { bg:'#ec4899', border:'#db2777', text:'#fff',     light:'#fdf2f8', name:'粉' },
  white:   { bg:'#f3f4f6', border:'#d1d5db', text:'#374151',  light:'#f9fafb', name:'白' },
  black:   { bg:'#1c1917', border:'#0c0a09', text:'#fff',     light:'#f5f5f4', name:'黑' },
  gray:    { bg:'#6b7280', border:'#4b5563', text:'#fff',     light:'#f9fafb', name:'灰' },
  brown:   { bg:'#92400e', border:'#78350f', text:'#fff',     light:'#fffbeb', name:'咖啡' },
  milktea: { bg:'#c9a97a', border:'#a87d50', text:'#fff',     light:'#fdf8f0', name:'奶茶' },
};
const PALETTE_KEYS = Object.keys(PALETTE);
const DEFAULT_COLORS = ['red','yellow','blue','green','orange','purple','pink','black'];
const ADD_BUTTONS = [+1, +5, +10];
const SUB_BUTTONS = [-1, -5, -10];

// ── 顏色選擇器 ────────────────────────────────────
function ColorPicker({ currentKey, onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [onClose]);
  return (
    <div ref={ref} style={{ position:'absolute', top:'100%', right:0, zIndex:50, background:'#fff', borderRadius:16, padding:10, boxShadow:'0 8px 30px rgba(0,0,0,0.2)', display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6, minWidth:192 }}>
      {PALETTE_KEYS.map(k => (
        <button key={k} onClick={() => { onSelect(k); onClose(); }} title={PALETTE[k].name}
          style={{ width:28, height:28, borderRadius:'50%', background:PALETTE[k].bg, border: k === currentKey ? '3px solid #1c1917' : '2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', cursor:'pointer' }} />
      ))}
    </div>
  );
}

// ── 計分頁 - 單張卡片 ─────────────────────────────
function PlayerCard({ player, rank, currentRound, onScore, onUndo, onReset, onConfirm, onUnconfirm, rotated, onToggleRotate }) {
  const c = PALETTE[player.colorKey] || PALETTE.red;
  const isConfirmed = player.confirmed;

  const cardContent = (
    <div style={{ border:`2px solid ${c.border}`, borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', opacity: isConfirmed ? 0.75 : 1, transition:'opacity 0.2s' }}>
      {/* 色條 */}
      <div style={{ background: c.bg, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', position:'relative' }}>
        <button onClick={onToggleRotate} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', flex:1 }}>
          <span style={{ fontSize:26, fontWeight:900, color:c.text, opacity:0.25, lineHeight:1 }}>#{rank}</span>
          <span style={{ fontSize:18, fontWeight:900, color:c.text, letterSpacing:1 }}>{player.name}</span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {isConfirmed && <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.3)', color:c.text }}>✓ 已確認</span>}
          {/* 旋轉鈕 */}
          <button onClick={onToggleRotate} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.25)', border:'none', borderRadius:20, padding:'3px 8px', cursor:'pointer', color:c.text, fontSize:12, fontWeight:700 }}>
            <RotateCw size={13} />旋轉
          </button>
        </div>
      </div>

      {/* 主體 */}
      <div style={{ background: c.light, padding:10 }}>
        <div style={{ display:'flex', gap:8 }}>
          {/* 左：分數 + 歷史 */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, width:92, flexShrink:0 }}>
            <div style={{ background:'#fff', borderRadius:12, padding:'8px 6px', textAlign:'center', border:'1px solid #e5e7eb', boxShadow:'inset 0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:30, fontWeight:900, color:'#1c1917', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{player.score}</div>
            </div>
            <div style={{ fontSize:11, color:'#78716c', lineHeight:1.6, paddingLeft:2 }}>
              {(player.roundHistory && player.roundHistory.length > 0) ? (
                <div>
                  {[...(player.roundHistory)].reverse().slice(0,3).reverse().map((delta, i, arr) => (
                    <span key={i}>
                      {i > 0 && <span style={{ color:'#d6d3d1', margin:'0 2px' }}>|</span>}
                      <span style={{ fontWeight:700, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
                        {delta >= 0 ? '+':''}{delta}
                      </span>
                    </span>
                  ))}
                </div>
              ) : <span style={{ color:'#d6d3d1' }}>—</span>}
            </div>
          </div>

          {/* 右：按鈕 */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4 }}>
            {ADD_BUTTONS.map(v => (
              <button key={v} disabled={isConfirmed} onClick={() => onScore(player.id, v)}
                style={{ padding:'10px 0', borderRadius:10, background:'#fde047', border:'none', fontWeight:700, fontSize:14, color:'#1c1917', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', opacity: isConfirmed ? 0.4 : 1 }}>
                +{v}
              </button>
            ))}
            {isConfirmed ? (
              <button onClick={() => onUnconfirm(player.id)}
                style={{ padding:'10px 0', borderRadius:10, background:'#f59e0b', border:'none', fontWeight:700, fontSize:12, color:'#fff', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                取消
              </button>
            ) : (
              <button onClick={() => onConfirm(player.id)}
                style={{ padding:'10px 0', borderRadius:10, background:'#1c1917', border:'none', fontWeight:700, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                <CornerDownLeft size={17} />
              </button>
            )}
            {SUB_BUTTONS.map(v => (
              <button key={v} disabled={isConfirmed} onClick={() => onScore(player.id, v)}
                style={{ padding:'10px 0', borderRadius:10, background:'#7dd3fc', border:'none', fontWeight:700, fontSize:14, color:'#1c1917', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', opacity: isConfirmed ? 0.4 : 1 }}>
                {v}
              </button>
            ))}
            <button disabled={isConfirmed || !(player.undoStack && player.undoStack.length > 0)} onClick={() => onUndo(player.id)}
              style={{ padding:'10px 0', borderRadius:10, background:'#7dd3fc', border:'none', color:'#1c1917', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', opacity: (isConfirmed || !(player.undoStack && player.undoStack.length > 0)) ? 0.4 : 1 }}>
              <Undo2 size={15} />
            </button>
          </div>
        </div>
        <button disabled={isConfirmed} onClick={() => onReset(player.id)}
          style={{ marginTop:6, width:'100%', padding:'6px 0', borderRadius:10, background:'rgba(255,255,255,0.7)', border:'1px solid #e5e7eb', color:'#a8a29e', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:4, cursor:'pointer', opacity: isConfirmed ? 0.5 : 1 }}>
          <RotateCcw size={12} />歸零
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom:12, transform: rotated ? 'rotate(180deg)' : 'none', transition:'transform 0.3s' }}>
      {cardContent}
    </div>
  );
}

// ── 計分頁主體 ────────────────────────────────────
function ScoringView({ initialPlayers, totalRounds, sortMode, onExit }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [currentRound, setCurrentRound] = useState(1);
  const [rotatedIds, setRotatedIds] = useState(new Set());

  // 排名只在全員確認時更新
  const [cardOrder, setCardOrder] = useState(() => initialPlayers.map(p => p.id));
  const [displayRanks, setDisplayRanks] = useState(() => Object.fromEntries(initialPlayers.map((_, i) => [i, 1])));

  const getPlayerById = (id) => players.find(p => p.id === id);

  const computeRanks = (playerList) => {
    const sorted = [...playerList].sort((a, b) => b.score - a.score);
    const ranks = {};
    sorted.forEach((p, i, arr) => {
      ranks[p.id] = i === 0 ? 1 : (arr[i-1].score === p.score ? ranks[arr[i-1].id] : i + 1);
    });
    // 依 sortMode 決定卡片排列順序
    let order;
    if (sortMode === 'desc') order = sorted.map(p => p.id);
    else if (sortMode === 'asc') order = [...sorted].reverse().map(p => p.id);
    else order = null; // null = 不改變
    return { order, ranks };
  };

  const handleScore = useCallback((id, delta) => {
    setPlayers(prev => prev.map(p =>
      p.id === id ? { ...p, score: p.score + delta, pendingDelta: (p.pendingDelta||0) + delta, undoStack: [...(p.undoStack||[]), delta] } : p
    ));
  }, []);

  const handleUndo = useCallback((id) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== id || !(p.undoStack && p.undoStack.length > 0)) return p;
      const last = p.undoStack[p.undoStack.length - 1];
      return { ...p, score: p.score - last, pendingDelta: (p.pendingDelta||0) - last, undoStack: p.undoStack.slice(0, -1) };
    }));
  }, []);

  const handleReset = useCallback((id) => {
    if (!window.confirm('確定要將此玩家分數歸零嗎？')) return;
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, score: 0, pendingDelta: 0, undoStack: [], roundHistory: [] } : p));
  }, []);

  const handleConfirm = useCallback((id) => {
    setPlayers(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const delta = p.pendingDelta || 0;
        const newRoundHistory = delta !== 0 ? [...(p.roundHistory||[]), delta] : (p.roundHistory||[]);
        return { ...p, confirmed: true, roundHistory: newRoundHistory, pendingDelta: 0, undoStack: [] };
      });
      const allConfirmed = next.every(p => p.confirmed);
      if (allConfirmed) {
        const isLast = totalRounds > 1 && currentRound >= totalRounds;
        const { order, ranks } = computeRanks(next);
        if (order) setCardOrder(order); // 只在有排序模式時才重排
        setDisplayRanks(ranks);
        if (isLast) {
          const winner = [...next].sort((a, b) => b.score - a.score)[0];
          alert(`遊戲結束！第一名：${winner.name} 🎉`);
        } else {
          setCurrentRound(r => r + 1);
          return next.map(p => ({ ...p, confirmed: false }));
        }
      }
      return next;
    });
  }, [currentRound, totalRounds]);

  const handleUnconfirm = useCallback((id) => {
    setPlayers(prev => prev.map(p =>
      p.id === id ? { ...p, confirmed: false, roundHistory: (p.roundHistory||[]).slice(0, -1) } : p
    ));
  }, []);

  const handleToggleRotate = useCallback((id) => {
    setRotatedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const handleColorChange = useCallback((id, colorKey) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, colorKey } : p));
  }, []);

  const allConfirmed = players.every(p => p.confirmed);

  return (
    <div style={{ maxWidth:512, margin:'0 auto', background:'#F5F2EB', minHeight:'calc(100vh - 60px)' }}>
      <div style={{ position:'sticky', top:60, zIndex:30, background:'rgba(28,25,23,0.9)', backdropFilter:'blur(8px)', color:'#fff', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontWeight:700, fontSize:14 }}>
          {totalRounds === 1 ? '無限制回合' : `第 ${currentRound} / ${totalRounds} 回合`}
        </span>
        {allConfirmed && totalRounds === 1 && <span style={{ fontSize:12, color:'#fcd34d' }} className="animate-pulse">所有人已確認！</span>}
        <button onClick={onExit} style={{ fontSize:12, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:20, padding:'5px 12px', color:'#fff', cursor:'pointer' }}>結束遊戲</button>
      </div>
      <div style={{ padding:12 }}>
        {cardOrder.map(id => {
          const player = getPlayerById(id);
          if (!player) return null;
          return (
            <PlayerCard
              key={id}
              player={player}
              rank={displayRanks[id] ?? 1}
              currentRound={currentRound}
              onScore={handleScore}
              onUndo={handleUndo}
              onReset={handleReset}
              onConfirm={handleConfirm}
              onUnconfirm={handleUnconfirm}
              rotated={rotatedIds.has(id)}
              onToggleRotate={() => handleToggleRotate(id)}
              onColorChange={handleColorChange}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── 設定頁 ────────────────────────────────────────
function SetupView({ onStart }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState(Array(8).fill(''));
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [totalRounds, setTotalRounds] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(-1);
  const [sortMode, setSortMode] = useState('none'); // 'none' | 'desc' | 'asc'

  const handleStart = () => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: i, name: names[i].trim() || `玩家 ${i+1}`,
      score: 0,
      pendingDelta: 0,   // 本回合尚未確認的累積變化量
      undoStack: [],     // 本回合全部按鈕操作（供復原用）
      roundHistory: [],  // 確認實际記錄（展示用）
      confirmed: false,
      colorKey: colors[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));
    onStart(players, totalRounds, sortMode);
  };

  return (
    <div style={{ maxWidth:512, margin:'0 auto', padding:'16px 16px 100px', minHeight:'calc(100vh-60px)', background:'#F5F2EB' }}>
      <h2 style={{ textAlign:'center', fontSize:22, fontWeight:900, color:'#1c1917', margin:'16px 0 20px', letterSpacing:1 }}>萬用計分器</h2>

      {/* 玩家人數 */}
      <div style={{ background:'#fff', borderRadius:16, padding:20, marginBottom:12, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, color:'#57534e', marginBottom:10 }}>玩家人數</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f5f5f4', borderRadius:12, padding:6, border:'1px solid #e5e7eb' }}>
          <button onClick={() => setPlayerCount(c => Math.max(2, c-1))} style={{ width:44, height:44, borderRadius:10, background:'#fff', border:'none', fontSize:20, fontWeight:700, color:'#57534e', cursor:'pointer' }}>−</button>
          <span style={{ fontSize:22, fontWeight:900, color:'#1c1917' }}>{playerCount} 人</span>
          <button onClick={() => setPlayerCount(c => Math.min(8, c+1))} style={{ width:44, height:44, borderRadius:10, background:'#fff', border:'none', fontSize:20, fontWeight:700, color:'#57534e', cursor:'pointer' }}>＋</button>
        </div>
      </div>

      {/* 玩家名稱 + 顏色 */}
      <div style={{ background:'#fff', borderRadius:16, padding:20, marginBottom:12, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, color:'#57534e', marginBottom:10 }}>玩家名稱與顏色 <span style={{ fontWeight:400, fontSize:12, color:'#a8a29e' }}>（名稱選填）</span></div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {Array.from({ length: playerCount }).map((_, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, position:'relative' }}>
              {/* 顏色選取 */}
              <div style={{ position:'relative' }}>
                <button onClick={() => setPickerOpen(pickerOpen === i ? -1 : i)}
                  style={{ width:28, height:28, borderRadius:'50%', background: PALETTE[colors[i]]?.bg || '#ef4444', border: '2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', cursor:'pointer', flexShrink:0 }} />
                {pickerOpen === i && (
                  <ColorPicker currentKey={colors[i]} onSelect={(k) => { setColors(prev => { const n=[...prev]; n[i]=k; return n; }); }} onClose={() => setPickerOpen(-1)} />
                )}
              </div>
              <input type="text" maxLength={10} placeholder={`玩家 ${i+1}`} value={names[i]}
                onChange={e => setNames(prev => { const n=[...prev]; n[i]=e.target.value; return n; })}
                style={{ flex:1, border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 14px', fontSize:15, fontWeight:500, color:'#1c1917', background:'#f5f5f4', outline:'none' }} />
            </div>
          ))}
        </div>
      </div>

      {/* 排序方式 */}
      <div style={{ background:'#fff', borderRadius:16, padding:20, marginBottom:20, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, color:'#57534e', marginBottom:10 }}>確認後排序方式</div>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'none', label:'不排序（固定順序）' },
            { key:'desc', label:'高分在前' },
            { key:'asc',  label:'低分在前' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setSortMode(opt.key)}
              style={{ flex:1, padding:'10px 4px', borderRadius:12, border: sortMode === opt.key ? '2px solid #c2410c' : '2px solid #e5e7eb', background: sortMode === opt.key ? '#fff7ed' : '#f5f5f4', color: sortMode === opt.key ? '#c2410c' : '#78716c', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ background:'#fff', borderRadius:16, padding:20, marginBottom:20, border:'1px solid #e5e7eb' }}>
        <div style={{ fontWeight:700, color:'#57534e', marginBottom:10 }}>總回合數 <span style={{ fontWeight:400, fontSize:12, color:'#a8a29e' }}>（1 = 無限制）</span></div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f5f5f4', borderRadius:12, padding:6, border:'1px solid #e5e7eb' }}>
          <button onClick={() => setTotalRounds(r => Math.max(1, r-1))} style={{ width:44, height:44, borderRadius:10, background:'#fff', border:'none', fontSize:20, fontWeight:700, color:'#57534e', cursor:'pointer' }}>−</button>
          <span style={{ fontSize:22, fontWeight:900, color:'#1c1917' }}>{totalRounds === 1 ? '無限制' : `${totalRounds} 回合`}</span>
          <button onClick={() => setTotalRounds(r => Math.min(50, r+1))} style={{ width:44, height:44, borderRadius:10, background:'#fff', border:'none', fontSize:20, fontWeight:700, color:'#57534e', cursor:'pointer' }}>＋</button>
        </div>
      </div>

      <button onClick={handleStart} style={{ width:'100%', padding:'16px 0', background:'#c2410c', border:'none', borderRadius:16, color:'#fff', fontWeight:700, fontSize:18, cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
        開始計分 →
      </button>
    </div>
  );
}

// ── 主元件 ────────────────────────────────────────
export default function UniversalScorerPage({ onGoToMember, isLoggedIn }) {
  const [gameState, setGameState] = useState(null);
  const handleStart = (players, totalRounds, sortMode) => setGameState({ players, totalRounds, sortMode });
  const handleExit = () => { if (window.confirm('確定要結束遊戲並回到設定頁嗎？')) setGameState(null); };
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">會員專屬功能</h2>
        <p className="text-sm text-stone-500 mb-6">萬用計分器僅限會員使用<br/>請先登入會員帳號來解鎖</p>
        <button
          onClick={onGoToMember}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-sm shadow-orange-200 hover:opacity-90 transition"
        >
          前往會員登入
        </button>
      </div>
    )
  }
  if (!gameState) return <SetupView onStart={handleStart} />;
  return <ScoringView initialPlayers={gameState.players} totalRounds={gameState.totalRounds} sortMode={gameState.sortMode} onExit={handleExit} />;
}
