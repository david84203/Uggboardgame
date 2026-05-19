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
const DEFAULT_COLORS = ['red','yellow','blue','green','orange','purple','pink','black','gray','brown','milktea','white'];
const ADD_BUTTONS = [+1, +5, +10];
const SUB_BUTTONS = [-1, -5, -10];

// ── 顏色選擇器 ────────────────────────────────────
function ColorPicker({ currentKey, onSelect, onClose, triggerRef }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const pw = 200;
      let left = rect.left;
      if (left + pw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pw - 8);
      setPos({ top: rect.bottom + 6, left });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [onClose]);

  return (
    <div ref={ref} style={{ position:'fixed', top: pos.top, left: pos.left, zIndex:1000, background:'#fff', borderRadius:16, padding:10, boxShadow:'0 8px 30px rgba(0,0,0,0.2)', display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6, width:192 }}>
      {PALETTE_KEYS.map(k => (
        <button key={k} onClick={() => { onSelect(k); onClose(); }} title={PALETTE[k].name}
          style={{ width:28, height:28, borderRadius:'50%', background:PALETTE[k].bg, border: k === currentKey ? '3px solid #1c1917' : '2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', cursor:'pointer' }} />
      ))}
    </div>
  );
}

// ── 計分頁 - 單張卡片 ─────────────────────────────
function PlayerCard({ player, rank, currentRound, onScore, onUndo, onReset, onConfirm, onUnconfirm, rotated, onToggleRotate, isTableMode }) {
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
            <div style={{ paddingLeft:2 }}>
              {(player.roundHistory && player.roundHistory.length > 0) ? (() => {
                const N = player.roundHistory.length;
                // 每 3 筆為一單位，最多保留兩單位 (6筆)
                const startIndex = Math.max(0, Math.floor((N - 1) / 3) * 3 - 3);
                const items = player.roundHistory.slice(startIndex, startIndex + 6);
                const col1 = items.slice(0, 3);
                const col2 = items.slice(3, 6);
                
                return (
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {col1.map((delta, i) => (
                        <span key={startIndex + i} style={{ fontWeight: 800, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
                          {delta >= 0 ? '+' : ''}{delta}
                        </span>
                      ))}
                    </div>
                    {col2.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {col2.map((delta, i) => (
                          <span key={startIndex + 3 + i} style={{ fontWeight: 800, color: delta >= 0 ? '#16a34a' : '#dc2626' }}>
                            {delta >= 0 ? '+' : ''}{delta}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })() : null}
            </div>
          </div>

          {/* 右：按鈕 — 改為 3 欄，歸零/確認/復原共用最後一列 */}
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:4 }}>
            {/* 第一列：加分 */}
            {ADD_BUTTONS.map(v => (
              <button key={v} disabled={isConfirmed} onClick={() => onScore(player.id, v)}
                style={{ padding:'10px 0', borderRadius:10, background:'#fde047', border:'none', fontWeight:700, fontSize:14, color:'#1c1917', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', opacity: isConfirmed ? 0.4 : 1 }}>
                +{v}
              </button>
            ))}
            {/* 第二列：減分 */}
            {SUB_BUTTONS.map(v => (
              <button key={v} disabled={isConfirmed} onClick={() => onScore(player.id, v)}
                style={{ padding:'10px 0', borderRadius:10, background:'#7dd3fc', border:'none', fontWeight:700, fontSize:14, color:'#1c1917', cursor:'pointer', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', opacity: isConfirmed ? 0.4 : 1 }}>
                {v}
              </button>
            ))}
            {/* 第三列：歸零 ｜ 復原 ｜ 確認/取消 */}
            <button disabled={isConfirmed} onClick={() => onReset(player.id)}
              style={{ padding:'10px 0', borderRadius:10, background:'rgba(255,255,255,0.7)', border:'1px solid #e5e7eb', color:'#a8a29e', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:3, cursor:'pointer', opacity: isConfirmed ? 0.5 : 1 }}>
              <RotateCcw size={12} />歸零
            </button>
            <button disabled={isConfirmed || !(player.undoStack && player.undoStack.length > 0)} onClick={() => onUndo(player.id)}
              style={{ padding:'10px 0', borderRadius:10, background:'#7dd3fc', border:'none', color:'#1c1917', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', opacity: (isConfirmed || !(player.undoStack && player.undoStack.length > 0)) ? 0.4 : 1 }}>
              <Undo2 size={15} />
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ 
      marginBottom: isTableMode ? 0 : 12, 
      width: isTableMode ? 340 : '100%',
      transform: rotated ? 'rotate(180deg)' : 'none', 
      transition:'transform 0.3s' 
    }}>
      {cardContent}
    </div>
  );
}

const getTablePositions = (count, containerW) => {
  const CARD_W = 340;
  // 旋轉 90° 後，卡片水平佔寬 = 卡片原始高度（實際測量約 215px）
  const CARD_H_EST = 215;
  const cW = containerW || window.innerWidth;
  const halfW = cW / 2;

  // 縮放：最高可放大至 1.15，左右最少留 8px，乘以 0.93 微調大小避免上下重疊
  const S_SIDE = Math.min((halfW - 8) / CARD_H_EST, 1.15) * 0.93;

  // 動態計算欄位中心：讓兩欄卡片的內緣在容器中心各留 5px（共 10px 中間間隙）
  const CENTER_GAP_HALF = 5; // 每欄距中心的距離
  const cardHalfW = (CARD_H_EST * S_SIDE) / 2;
  const L_abs = halfW - cardHalfW - CENTER_GAP_HALF;
  const L = (L_abs / cW) * 100; // 轉為 %
  const R = 100 - L;

  // 5 人與 6 人的統一縮放比例（為了統一大小且不重疊，整體縮小）
  const S_5P = S_SIDE * 0.79;
  const cardHalfW_5 = (CARD_H_EST * S_5P) / 2;
  const L_5 = ((halfW - cardHalfW_5 - CENTER_GAP_HALF) / cW) * 100;
  const R_5 = 100 - L_5;

  // 6 人的統一縮放比例（為了底部能塞兩張，必須以容器一半的寬度為基準來縮小）
  const S_6P = Math.min((cW * 0.48) / CARD_W, S_SIDE);
  const cardHalfW_6 = (CARD_H_EST * S_6P) / 2;
  const L_6 = ((halfW - cardHalfW_6 - CENTER_GAP_HALF) / cW) * 100;
  const R_6 = 100 - L_6;

  // 根據要求，將 6 人排版兩側的 4 張卡片獨立放大 20% (1.15 再放大約 5%)
  const S_6P_SIDE = S_6P * 1.20;
  const cardHalfW_6_SIDE = (CARD_H_EST * S_6P_SIDE) / 2;
  const L_6_SIDE = ((halfW - cardHalfW_6_SIDE - CENTER_GAP_HALF) / cW) * 100;
  const R_6_SIDE = 100 - L_6_SIDE;

  const getStyle = (cx, cy, rot, s) => ({
    position: 'absolute',
    top: `${cy}%`,
    left: `${cx}%`,
    width: CARD_W,
    transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
    transformOrigin: 'center center',
  });

  if (count === 3) {
    return [
      getStyle(L, 25, 90, S_SIDE),
      getStyle(L, 75, 90, S_SIDE),
      getStyle(R, 50, -90, S_SIDE),
    ];
  }
  if (count === 4) {
    return [
      getStyle(L, 25, 90, S_SIDE),
      getStyle(L, 75, 90, S_SIDE),
      getStyle(R, 25, -90, S_SIDE),
      getStyle(R, 75, -90, S_SIDE),
    ];
  }
  if (count === 5) {
    return [
      getStyle(L_5, 20, 90, S_5P),
      getStyle(L_5, 58, 90, S_5P),
      getStyle(R_5, 20, -90, S_5P),
      getStyle(R_5, 58, -90, S_5P),
      getStyle(50, 88.5, 0, S_5P), // 底部置中
    ];
  }
  if (count >= 6) {
    return [
      getStyle(L_6_SIDE, 20, 90, S_6P_SIDE),
      getStyle(L_6_SIDE, 59.5, 90, S_6P_SIDE),
      getStyle(R_6_SIDE, 20, -90, S_6P_SIDE),
      getStyle(R_6_SIDE, 59.5, -90, S_6P_SIDE),
      getStyle(25.5, 89, 0, S_6P), // 底部左 (微調往右一點點)
      getStyle(74.5, 89, 0, S_6P), // 底部右 (微調往左一點點)
    ];
  }
  return Array.from({length: count}).map((_, i) => getStyle(50, 20 + i * 20, 0, S_SIDE));
};

// ── 計分頁主體 ────────────────────────────────────
function ScoringView({ initialPlayers, totalRounds, sortMode, onExit }) {
  const [players, setPlayers] = useState(initialPlayers);
  const [currentRound, setCurrentRound] = useState(1);
  const [rotatedIds, setRotatedIds] = useState(new Set());
  const [layoutMode, setLayoutMode] = useState('list'); // 'list' | 'table'
  const tableContainerRef = useRef(null);
  const [containerW, setContainerW] = useState(window.innerWidth);

  useEffect(() => {
    if (!tableContainerRef.current) return;
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 0) setContainerW(w);
    });
    obs.observe(tableContainerRef.current);
    return () => obs.disconnect();
  }, [layoutMode]);

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
      // 1. 只更新該玩家的確認狀態，先不寫入歷史紀錄
      const next = prev.map(p => p.id === id ? { ...p, confirmed: true } : p);
      
      const allConfirmed = next.every(p => p.confirmed);
      if (allConfirmed) {
        // 2. 當所有人都確認時，才把 pendingDelta 結算進 roundHistory
        const finalPlayers = next.map(p => {
          const delta = p.pendingDelta || 0;
          const newRoundHistory = [...(p.roundHistory||[]), delta];
          return { ...p, roundHistory: newRoundHistory, pendingDelta: 0, undoStack: [] };
        });

        const isLast = totalRounds > 1 && currentRound >= totalRounds;
        const { order, ranks } = computeRanks(finalPlayers);
        if (order) setCardOrder(order); // 只在有排序模式時才重排
        setDisplayRanks(ranks);
        
        if (isLast) {
          const winner = [...finalPlayers].sort((a, b) => b.score - a.score)[0];
          alert(`遊戲結束！第一名：${winner.name} 🎉`);
          return finalPlayers; // 保持已確認狀態
        } else {
          setCurrentRound(r => r + 1);
          // 進入下一回合，所有人解除確認
          return finalPlayers.map(p => ({ ...p, confirmed: false }));
        }
      }
      return next;
    });
  }, [currentRound, totalRounds]);

  const handleUnconfirm = useCallback((id) => {
    setPlayers(prev => prev.map(p =>
      p.id === id ? { ...p, confirmed: false } : p
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
        <div style={{ display:'flex', gap: 8 }}>
          <button onClick={() => setLayoutMode(m => m === 'list' ? 'table' : 'list')}
            style={{ fontSize:12, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:20, padding:'5px 12px', color:'#fff', cursor:'pointer' }}>
            {layoutMode === 'list' ? '桌邊排版' : '列表排版'}
          </button>
          <button onClick={onExit} style={{ fontSize:12, background:'rgba(255,255,255,0.2)', border:'none', borderRadius:20, padding:'5px 12px', color:'#fff', cursor:'pointer' }}>結束遊戲</button>
        </div>
      </div>
      {layoutMode === 'table' ? (
        <div ref={tableContainerRef} style={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
          {players.map((p, index) => {
            const pos = getTablePositions(players.length, containerW)[index];
            if (!pos) return null;
            return (
              <div key={p.id} style={{ ...pos, transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: p.confirmed ? 1 : 10 }}>
                <PlayerCard
                  player={p}
                  rank={displayRanks[p.id] ?? 1}
                  currentRound={currentRound}
                  onScore={handleScore}
                  onUndo={handleUndo}
                  onReset={handleReset}
                  onConfirm={handleConfirm}
                  onUnconfirm={handleUnconfirm}
                  rotated={rotatedIds.has(p.id)}
                  onToggleRotate={() => handleToggleRotate(p.id)}
                  onColorChange={handleColorChange}
                  isTableMode={true}
                />
              </div>
            );
          })}
        </div>
      ) : (
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
                isTableMode={false}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── 設定頁 ────────────────────────────────────────
function SetupView({ onStart }) {
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState(Array(12).fill(''));
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [totalRounds, setTotalRounds] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(-1);
  const [sortMode, setSortMode] = useState('none'); // 'none' | 'desc' | 'asc'
  const pickerBtnRefs = useRef([]);

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
          <button onClick={() => setPlayerCount(c => Math.min(12, c+1))} style={{ width:44, height:44, borderRadius:10, background:'#fff', border:'none', fontSize:20, fontWeight:700, color:'#57534e', cursor:'pointer' }}>＋</button>
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
                <button ref={el => pickerBtnRefs.current[i] = el}
                  onClick={() => setPickerOpen(pickerOpen === i ? -1 : i)}
                  style={{ width:28, height:28, borderRadius:'50%', background: PALETTE[colors[i]]?.bg || '#ef4444', border: '2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', cursor:'pointer', flexShrink:0 }} />
                {pickerOpen === i && (
                  <ColorPicker currentKey={colors[i]} onSelect={(k) => { setColors(prev => { const n=[...prev]; n[i]=k; return n; }); }} onClose={() => setPickerOpen(-1)} triggerRef={{ current: pickerBtnRefs.current[i] }} />
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
