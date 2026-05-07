import { useState, useRef, useCallback, useEffect } from 'react';

/* ───── 顏色順序 ───── */
const COLORS = [
  { name: '紅', hex: '#FF0000', text: '#fff' },
  { name: '橙', hex: '#FF7F00', text: '#fff' },
  { name: '黃', hex: '#FFFF00', text: '#333' },
  { name: '綠', hex: '#00FF00', text: '#333' },
  { name: '藍', hex: '#0000FF', text: '#fff' },
  { name: '靛', hex: '#4B0082', text: '#fff' },
  { name: '紫', hex: '#9400D3', text: '#fff' },
  { name: '黑', hex: '#000000', text: '#fff' },
  { name: '白', hex: '#FFFFFF', text: '#333' },
  { name: '灰', hex: '#808080', text: '#fff' },
  { name: '粉紅', hex: '#FFC0CB', text: '#333' },
  { name: '咖啡', hex: '#8B4513', text: '#fff' },
];

const CIRCLE_SIZE  = 140;
const INNER_SIZE   = 92;
const COUNTDOWN_SEC = 2;
const RADIUS = 66;
const CIRC   = 2 * Math.PI * RADIUS;

const STYLE = `
@keyframes shake {
  0%   { transform:translate(0,0) rotate(0deg); }
  10%  { transform:translate(-8px,-6px) rotate(-2deg); }
  20%  { transform:translate(8px,6px) rotate(2deg); }
  30%  { transform:translate(-10px,4px) rotate(-1deg); }
  40%  { transform:translate(10px,-4px) rotate(1.5deg); }
  50%  { transform:translate(-6px,8px) rotate(-1.5deg); }
  60%  { transform:translate(6px,-8px) rotate(1deg); }
  70%  { transform:translate(-4px,4px) rotate(-0.5deg); }
  80%  { transform:translate(4px,-4px) rotate(0.5deg); }
  90%  { transform:translate(-2px,2px) rotate(0deg); }
  100% { transform:translate(0,0) rotate(0deg); }
}
@keyframes glow-pulse {
  0%,100% {
    box-shadow:0 0 24px 10px currentColor,0 0 70px 24px currentColor,0 0 0 4px white;
    transform:translate(-50%,-50%) scale(1.25);
  }
  50% {
    box-shadow:0 0 48px 20px currentColor,0 0 120px 50px currentColor,0 0 0 5px white;
    transform:translate(-50%,-50%) scale(1.4);
  }
}
@keyframes order-pop {
  0%   { transform:translate(-50%,-50%) scale(0.5); opacity:0; }
  70%  { transform:translate(-50%,-50%) scale(1.15); }
  100% { transform:translate(-50%,-50%) scale(1); opacity:1; }
}
.shaking { animation:shake 0.5s ease-in-out; }
`;

function buildOrderMap(ids, winnerId) {
  const others = ids.filter(id => id !== winnerId);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const map = new Map();
  map.set(winnerId, 1);
  others.forEach((id, i) => map.set(id, i + 2));
  return map;
}

export default function StarPlayerPage() {
  // key = touch.identifier, value = { x, y, colorIdx }
  const fingersRef      = useRef(new Map());
  const colorMapRef     = useRef(new Map()); // identifier → colorIdx (持久保存)
  const colorCounterRef = useRef(0);

  const [fingers,       setFingers]       = useState(new Map());
  const [frozenFingers, setFrozenFingers] = useState(null);
  const [orderMap,      setOrderMap]      = useState(null);
  const [winnerId,      setWinnerId]      = useState(null);
  const [shaking,       setShaking]       = useState(false);
  const [phase,         setPhase]         = useState('idle');
  const [progress,      setProgress]      = useState(0);

  const timerRef     = useRef(null);
  const rafRef       = useRef(null);
  const startTimeRef = useRef(null);
  const containerRef = useRef(null);
  const phaseRef     = useRef('idle'); // 同步給事件 handler 用

  phaseRef.current = phase;

  const syncState = () => setFingers(new Map(fingersRef.current));

  /* ── 重置所有狀態 ── */
  const resetAll = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current)   { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    fingersRef.current.clear();
    colorMapRef.current.clear();
    colorCounterRef.current = 0;
    setFingers(new Map());
    setFrozenFingers(null);
    setOrderMap(null);
    setWinnerId(null);
    setPhase('idle');
    setProgress(0);
    startTimeRef.current = null;
  }, []);

  /* ── 停止倒數 ── */
  const stopCountdown = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current)   { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setProgress(0);
    startTimeRef.current = null;
  }, []);

  /* ── 開始倒數 ── */
  const startCountdown = useCallback(() => {
    stopCountdown();
    if (fingersRef.current.size === 0) return;
    setPhase('holding');
    startTimeRef.current = performance.now();

    const tick = () => {
      const p = Math.min((performance.now() - startTimeRef.current) / (COUNTDOWN_SEC * 1000), 1);
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      if (fingersRef.current.size === 0) return;
      const ids    = [...fingersRef.current.keys()];
      const chosen = ids[Math.floor(Math.random() * ids.length)];
      const om     = buildOrderMap(ids, chosen);
      setFrozenFingers(new Map(fingersRef.current));
      setOrderMap(om);
      setWinnerId(chosen);
      setPhase('picked');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }, COUNTDOWN_SEC * 1000);
  }, [stopCountdown]);

  /* ── 核心：用 e.touches 重新對齊 fingersRef ── */
  const reconcileTouches = useCallback((touches) => {
    const activeIds = new Set([...touches].map(t => t.identifier));

    // 刪除已離開的
    for (const id of fingersRef.current.keys()) {
      if (!activeIds.has(id)) {
        fingersRef.current.delete(id);
        // colorMap 保留，避免閃爍
      }
    }

    // 更新或新增
    for (const t of touches) {
      const id = t.identifier;
      if (fingersRef.current.has(id)) {
        const prev = fingersRef.current.get(id);
        fingersRef.current.set(id, { ...prev, x: t.clientX, y: t.clientY });
      } else {
        if (!colorMapRef.current.has(id)) {
          colorMapRef.current.set(id, colorCounterRef.current % COLORS.length);
          colorCounterRef.current++;
        }
        fingersRef.current.set(id, {
          x: t.clientX, y: t.clientY,
          colorIdx: colorMapRef.current.get(id),
        });
      }
    }
  }, []);

  /* ── Touch 事件（直接綁 DOM，passive:false） ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      e.preventDefault();

      // picked 狀態下任何觸碰 → 重置
      if (phaseRef.current === 'picked') {
        resetAll();
        return;
      }

      reconcileTouches(e.touches);
      syncState();
      stopCountdown();
      startCountdown();
    };

    const onTouchMove = (e) => {
      e.preventDefault();
      if (phaseRef.current === 'picked') return;
      reconcileTouches(e.touches);
      syncState();
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      if (phaseRef.current === 'picked') return;

      reconcileTouches(e.touches);
      syncState();

      if (fingersRef.current.size === 0) {
        stopCountdown();
        setPhase('idle');
      } else {
        stopCountdown();
        startCountdown();
      }
    };

    // touchcancel：瀏覽器強制取消（系統手勢等）→ 不清空，用剩餘 touches 對齊
    const onTouchCancel = (e) => {
      e.preventDefault();
      if (phaseRef.current === 'picked') return;
      reconcileTouches(e.touches); // e.touches 是「仍在螢幕上的」
      syncState();
      if (fingersRef.current.size === 0) {
        stopCountdown();
        setPhase('idle');
      } else {
        stopCountdown();
        startCountdown();
      }
    };

    el.addEventListener('touchstart',  onTouchStart,  { passive: false });
    el.addEventListener('touchmove',   onTouchMove,   { passive: false });
    el.addEventListener('touchend',    onTouchEnd,    { passive: false });
    el.addEventListener('touchcancel', onTouchCancel, { passive: false });

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('touchend',    onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [reconcileTouches, startCountdown, stopCountdown, resetAll]);

  const displayFingers = phase === 'picked' && frozenFingers ? frozenFingers : fingers;

  return (
    <>
      <style>{STYLE}</style>
      <div
        ref={containerRef}
        className={shaking ? 'shaking' : ''}
        style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0014 100%)',
          touchAction: 'none', userSelect: 'none', overflow: 'hidden', cursor: 'none',
        }}
      >
        {/* 空畫面提示 */}
        {phase === 'idle' && fingers.size === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>✋</div>
            <div style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: 700,
              textAlign: 'center', lineHeight: 1.7, padding: '0 32px',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}>
              請所有人將手指<br />長按在螢幕上
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12 }}>
              支援最多 12 人
            </div>
          </div>
        )}

        {/* 倒數提示 */}
        {phase === 'holding' && (
          <div style={{
            position: 'absolute', top: 24, left: 0, right: 0, textAlign: 'center',
            color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 600,
            pointerEvents: 'none', textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          }}>
            保持不動，即將抽籤…
          </div>
        )}

        {/* 結果提示 */}
        {phase === 'picked' && (
          <div style={{
            position: 'absolute', bottom: 48, left: 0, right: 0,
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}>
              🎉 起始玩家選出！
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 8 }}>
              點擊螢幕即可重置
            </div>
          </div>
        )}

        {/* 圓圈 */}
        {[...displayFingers.entries()].map(([id, { x, y, colorIdx }]) => {
          const color    = COLORS[colorIdx];
          const isWinner = phase === 'picked' && winnerId === id;
          const isLoser  = phase === 'picked' && !isWinner;
          const order    = orderMap?.get(id);

          return (
            <div key={id} style={{
              position: 'absolute', left: x, top: y,
              width: CIRCLE_SIZE, height: CIRCLE_SIZE,
              transform: 'translate(-50%,-50%)',
              pointerEvents: 'none',
              filter: isLoser ? 'grayscale(100%) brightness(0.35)' : 'none',
              transition: 'filter 0.35s',
              zIndex: isWinner ? 10 : 1,
            }}>
              {/* 倒數進度環 */}
              {phase === 'holding' && (
                <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}
                  style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={RADIUS}
                    fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={5} />
                  <circle cx={CIRCLE_SIZE/2} cy={CIRCLE_SIZE/2} r={RADIUS}
                    fill="none" stroke="white" strokeWidth={5} strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }} />
                </svg>
              )}

              {/* 主圓圈 */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: INNER_SIZE, height: INNER_SIZE,
                transform: 'translate(-50%,-50%)',
                borderRadius: '50%',
                background: color.hex,
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: isWinner
                  ? `0 0 30px 12px ${color.hex},0 0 90px 36px ${color.hex}88,0 0 0 5px white`
                  : `0 4px 20px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.3)`,
                animation: isWinner ? 'glow-pulse 0.8s ease-in-out infinite' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: phase === 'picked' ? 28 : 14,
                fontWeight: 900, color: color.text, letterSpacing: '0.01em',
                transition: 'font-size 0.2s',
              }}>
                {phase === 'picked' && order != null
                  ? <span style={{ animation: 'order-pop 0.4s ease-out forwards' }}>{order}</span>
                  : color.name
                }
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
