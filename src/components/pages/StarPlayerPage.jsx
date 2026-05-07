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

const CIRCLE_SIZE = 110;
const COUNTDOWN_SEC = 3;

/* ───── CSS 動畫注入 ───── */
const STYLE = `
@keyframes shake {
  0%   { transform: translate(0,0) rotate(0deg); }
  10%  { transform: translate(-8px, -6px) rotate(-2deg); }
  20%  { transform: translate(8px, 6px) rotate(2deg); }
  30%  { transform: translate(-10px, 4px) rotate(-1deg); }
  40%  { transform: translate(10px, -4px) rotate(1.5deg); }
  50%  { transform: translate(-6px, 8px) rotate(-1.5deg); }
  60%  { transform: translate(6px, -8px) rotate(1deg); }
  70%  { transform: translate(-4px, 4px) rotate(-0.5deg); }
  80%  { transform: translate(4px, -4px) rotate(0.5deg); }
  90%  { transform: translate(-2px, 2px) rotate(0deg); }
  100% { transform: translate(0,0) rotate(0deg); }
}
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px 8px currentColor, 0 0 60px 20px currentColor, 0 0 0 4px white; transform: translate(-50%,-50%) scale(1.3); }
  50%       { box-shadow: 0 0 40px 16px currentColor, 0 0 100px 40px currentColor, 0 0 0 4px white; transform: translate(-50%,-50%) scale(1.45); }
}
@keyframes countdown-ring {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: 283; }
}
.shaking { animation: shake 0.5s ease-in-out; }
`;

export default function StarPlayerPage() {
  // fingers: Map<pointerId, { x, y, colorIdx }>
  const fingersRef = useRef(new Map());
  const [fingers, setFingers] = useState(new Map());
  const [winnerId, setWinnerId] = useState(null);   // pointerId of winner
  const [shaking, setShaking] = useState(false);
  const [phase, setPhase] = useState('idle');        // idle | holding | picked
  const [progress, setProgress] = useState(0);      // 0~1 for countdown arc

  const timerRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const colorCounterRef = useRef(0);
  const containerRef = useRef(null);

  /* 同步 ref → state */
  const syncState = useCallback(() => {
    setFingers(new Map(fingersRef.current));
  }, []);

  /* 清除倒數計時器 */
  const clearCountdown = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setProgress(0);
    startTimeRef.current = null;
  }, []);

  /* 開始倒數 */
  const startCountdown = useCallback(() => {
    clearCountdown();
    if (fingersRef.current.size === 0) return;

    setPhase('holding');
    startTimeRef.current = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startTimeRef.current;
      const p = Math.min(elapsed / (COUNTDOWN_SEC * 1000), 1);
      setProgress(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      if (fingersRef.current.size === 0) return;
      // 抽籤！
      const ids = [...fingersRef.current.keys()];
      const chosen = ids[Math.floor(Math.random() * ids.length)];
      setWinnerId(chosen);
      setPhase('picked');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }, COUNTDOWN_SEC * 1000);
  }, [clearCountdown]);

  /* 重置倒數（有手指變動） */
  const resetCountdown = useCallback(() => {
    clearCountdown();
    if (fingersRef.current.size > 0) startCountdown();
    else setPhase('idle');
  }, [clearCountdown, startCountdown]);

  /* Pointer down */
  const onPointerDown = useCallback((e) => {
    e.preventDefault();
    if (fingersRef.current.size >= 12) return;
    containerRef.current?.setPointerCapture?.(e.pointerId);

    const colorIdx = colorCounterRef.current % COLORS.length;
    colorCounterRef.current++;

    fingersRef.current.set(e.pointerId, {
      x: e.clientX, y: e.clientY, colorIdx,
    });
    syncState();

    if (phase !== 'picked') resetCountdown();
  }, [syncState, resetCountdown, phase]);

  /* Pointer move */
  const onPointerMove = useCallback((e) => {
    e.preventDefault();
    if (!fingersRef.current.has(e.pointerId)) return;
    const prev = fingersRef.current.get(e.pointerId);
    fingersRef.current.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY });
    syncState();
  }, [syncState]);

  /* Pointer up / cancel */
  const onPointerUp = useCallback((e) => {
    e.preventDefault();
    fingersRef.current.delete(e.pointerId);
    syncState();

    if (phase === 'picked') {
      // 結果出來後，全部手指離開才重置
      if (fingersRef.current.size === 0) {
        setWinnerId(null);
        setPhase('idle');
        clearCountdown();
        colorCounterRef.current = 0;
      }
      return;
    }
    resetCountdown();
  }, [syncState, phase, clearCountdown, resetCountdown]);

  /* 防止頁面捲動 */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e) => e.preventDefault();
    el.addEventListener('touchstart', prevent, { passive: false });
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      el.removeEventListener('touchstart', prevent);
      el.removeEventListener('touchmove', prevent);
    };
  }, []);

  /* SVG arc helper */
  const RADIUS = 52;
  const CIRC = 2 * Math.PI * RADIUS; // ≈ 326.7

  return (
    <>
      <style>{STYLE}</style>
      <div
        ref={containerRef}
        className={shaking ? 'shaking' : ''}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0014 100%)',
          touchAction: 'none',
          userSelect: 'none',
          overflow: 'hidden',
          cursor: 'none',
        }}
      >
        {/* 提示文字 */}
        {phase === 'idle' && fingers.size === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✋</div>
            <div style={{
              color: 'rgba(255,255,255,0.85)', fontSize: 22, fontWeight: 700,
              textAlign: 'center', lineHeight: 1.6, padding: '0 32px',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}>
              請所有人將手指<br />長按在螢幕上
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 12 }}>
              支援最多 12 人
            </div>
          </div>
        )}

        {/* 倒數進度提示 */}
        {phase === 'holding' && (
          <div style={{
            position: 'absolute', top: 24, left: 0, right: 0,
            textAlign: 'center', color: 'rgba(255,255,255,0.6)',
            fontSize: 16, fontWeight: 600, pointerEvents: 'none',
            textShadow: '0 1px 6px rgba(0,0,0,0.8)',
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
            <div style={{
              color: '#fff', fontSize: 20, fontWeight: 700,
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
            }}>
              🎉 起始玩家選出！
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 }}>
              所有人放開手指即可重置
            </div>
          </div>
        )}

        {/* 圓圈 */}
        {[...fingers.entries()].map(([id, { x, y, colorIdx }]) => {
          const color = COLORS[colorIdx];
          const isWinner = winnerId === id;
          const isLoser = phase === 'picked' && !isWinner;

          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                left: x, top: y,
                width: CIRCLE_SIZE, height: CIRCLE_SIZE,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                transition: 'filter 0.3s, transform 0.3s',
                filter: isLoser ? 'grayscale(100%) brightness(0.4)' : 'none',
                zIndex: isWinner ? 10 : 1,
              }}
            >
              {/* SVG 倒數環 */}
              {phase === 'holding' && (
                <svg
                  width={CIRCLE_SIZE} height={CIRCLE_SIZE}
                  style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
                >
                  <circle
                    cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={4}
                  />
                  <circle
                    cx={CIRCLE_SIZE / 2} cy={CIRCLE_SIZE / 2} r={RADIUS}
                    fill="none"
                    stroke="white"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC * (1 - progress)}
                    style={{ transition: 'stroke-dashoffset 0.05s linear' }}
                  />
                </svg>
              )}

              {/* 主圓圈 */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                width: 72, height: 72,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: color.hex,
                border: '3px solid rgba(255,255,255,0.9)',
                boxShadow: isWinner
                  ? `0 0 30px 10px ${color.hex}, 0 0 80px 30px ${color.hex}88, 0 0 0 4px white`
                  : `0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3)`,
                animation: isWinner ? 'glow-pulse 0.8s ease-in-out infinite' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: color.text,
                letterSpacing: '0.02em',
              }}>
                {color.name}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
