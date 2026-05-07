import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

/* ───── 語音工具 ───── */
function speak(text, lang = 'zh-TW') {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.88; u.pitch = 0.9;
    u.onend = resolve;
    u.onerror = resolve; // 出錯也繼續
    window.speechSynthesis.speak(u);
  });
}

/* ───── 可中斷的 delay ───── */
function createDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

/* ───── 狀態 ───── */
const STATUS = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', DONE: 'done' };

/* ───── 腳本定義 ───── */
const SCRIPT = [
  { key: 'dark',      text: '天黑請閉眼，所有人請閉上眼睛。' },
  { key: 'open',      text: '白薔薇、司教、雙刃與巨刃，請睜開眼睛，互相確認身分。' },
  { key: 'countdown_identify', type: 'countdown', label: '確認身分中' },
  { key: 'close1',    text: '確認完畢。白薔薇、司教與巨刃，請閉上眼睛。雙刃請保持睜眼。' },
  { key: 'swap',      text: '請大家雙手輕敲桌面。雙刃，請將手中的幽魂牌，與桌面中央的雙刃牌進行秘密交換。' },
  { key: 'countdown_swap', type: 'countdown', label: '雙刃換牌中' },
  { key: 'close2',    text: '交換完畢，雙刃請閉上眼睛。' },
  { key: 'dawn',      text: '天亮了，所有人請睜開眼睛，遊戲開始。' },
];

export default function BladesAndRosePage() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [identifyDuration, setIdentifyDuration] = useState(8);
  const [swapDuration, setSwapDuration] = useState(8);
  const [displayText, setDisplayText] = useState('🌹');
  const [subtitle, setSubtitle] = useState('按下「開始遊戲」進入夜晚階段');
  const [countdown, setCountdown] = useState(null);
  const [countdownLabel, setCountdownLabel] = useState('');

  const abortRef = useRef(null);
  const pauseRef = useRef({ paused: false, resolve: null });

  const checkPause = useCallback(() => {
    if (!pauseRef.current.paused) return Promise.resolve();
    return new Promise(r => { pauseRef.current.resolve = r; });
  }, []);

  /* 語音播放 */
  const sayAndWait = useCallback(async (text, signal) => {
    await checkPause();
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    setSubtitle(text);
    await speak(text);
    await checkPause();
  }, [checkPause]);

  /* 逐秒倒數（可暫停），最後 5 秒語音唸數字 */
  const runCountdown = useCallback(async (totalSec, label, signal) => {
    setCountdownLabel(label);
    setDisplayText('');

    for (let s = totalSec; s >= 1; s--) {
      await checkPause();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      setCountdown(s);

      if (s <= 5) {
        // 最後 5 秒：語音唸數字
        window.speechSynthesis.cancel();
        setSubtitle(`⏱ ${s}...`);
        await speak(String(s));
        await createDelay(200, signal); // 語音後短暫緩衝
      } else {
        // 前段：純視覺倒數
        await createDelay(1000, signal);
      }
    }

    setCountdown(null);
    setCountdownLabel('');
  }, [checkPause]);

  /* ───── 主流程 ───── */
  const runGame = useCallback(async () => {
    const ac = new AbortController();
    abortRef.current = ac;
    const { signal } = ac;

    setStatus(STATUS.RUNNING);
    pauseRef.current.paused = false;

    try {
      /* 1. 天黑 */
      setDisplayText('🌙');
      await sayAndWait(SCRIPT[0].text, signal);
      await createDelay(2000, signal);

      /* 2. 喚醒確認身分 */
      setDisplayText('👁');
      await sayAndWait(SCRIPT[1].text, signal);

      /* 3. 確認身分倒數 */
      await runCountdown(identifyDuration, '確認身分中', signal);

      /* 4. 關眼，雙刃留 */
      setDisplayText('🗡️');
      await sayAndWait(SCRIPT[3].text, signal);
      await createDelay(2000, signal);

      /* 5. 雙刃換牌 */
      await sayAndWait(SCRIPT[4].text, signal);

      /* 6. 換牌倒數 */
      await runCountdown(swapDuration, '雙刃換牌中', signal);

      /* 7. 雙刃閉眼 */
      setDisplayText('🌙');
      await sayAndWait(SCRIPT[6].text, signal);
      await createDelay(2000, signal);

      /* 8. 天亮 */
      setDisplayText('☀️');
      await sayAndWait(SCRIPT[7].text, signal);

      setStatus(STATUS.DONE);
      setSubtitle('本回合結束，可按重置再玩一輪');
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }, [identifyDuration, swapDuration, sayAndWait, runCountdown]);

  /* 暫停 / 繼續 */
  const togglePause = useCallback(() => {
    if (status !== STATUS.RUNNING && status !== STATUS.PAUSED) return;
    if (!pauseRef.current.paused) {
      pauseRef.current.paused = true;
      window.speechSynthesis.pause();
      setStatus(STATUS.PAUSED);
    } else {
      pauseRef.current.paused = false;
      window.speechSynthesis.resume();
      pauseRef.current.resolve?.();
      pauseRef.current.resolve = null;
      setStatus(STATUS.RUNNING);
    }
  }, [status]);

  /* 重置 */
  const reset = useCallback(() => {
    abortRef.current?.abort();
    window.speechSynthesis.cancel();
    pauseRef.current = { paused: false, resolve: null };
    setStatus(STATUS.IDLE);
    setDisplayText('🌹');
    setSubtitle('按下「開始遊戲」進入夜晚階段');
    setCountdown(null);
    setCountdownLabel('');
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
    window.speechSynthesis.cancel();
  }, []);

  const isRunningOrPaused = status === STATUS.RUNNING || status === STATUS.PAUSED;

  /* ── 時間設定滑桿元件 ── */
  const DurationSlider = ({ label, value, onChange }) => (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Volume2 size={16} className="text-rose-400" />
        <span className="text-sm font-medium text-slate-300">{label}</span>
        <span className="ml-auto text-rose-400 font-bold text-base">{value} 秒</span>
      </div>
      <input type="range" min={5} max={15} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-rose-500" />
      <div className="flex justify-between text-xs text-slate-600 mt-1">
        <span>5 秒</span><span>10 秒</span><span>15 秒</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-red-950/20 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col min-h-dvh">

        {/* ── 標題 ── */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-extrabold tracking-wider text-rose-100">
            🌹 血與刃的白薔薇
          </h2>
          <p className="text-slate-500 text-sm mt-1">Blades &amp; Rose · 語音旁白系統</p>
        </div>

        {/* ── 設定區 ── */}
        {status === STATUS.IDLE && (
          <div className="bg-slate-900/70 backdrop-blur rounded-2xl p-5 mb-6 border border-rose-900/40 space-y-5">
            <DurationSlider label="確認身分時間" value={identifyDuration} onChange={setIdentifyDuration} />
            <div className="border-t border-slate-800" />
            <DurationSlider label="雙刃換牌時間" value={swapDuration} onChange={setSwapDuration} />
          </div>
        )}

        {/* ── 主顯示區 ── */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          {countdown !== null ? (
            <>
              <div className="text-base font-semibold text-rose-400 tracking-widest uppercase">
                {countdownLabel}
              </div>
              <div className={`text-9xl font-black tabular-nums transition-all duration-300
                ${status === STATUS.PAUSED ? 'opacity-40 animate-pulse' : 'text-rose-400'}`}>
                {countdown}
              </div>
            </>
          ) : (
            <div className={`text-8xl font-black tracking-wider transition-all duration-500
              ${status === STATUS.PAUSED ? 'opacity-40 animate-pulse' : 'opacity-100'}
              ${displayText === '🌙' ? 'text-indigo-300' : ''}
              ${displayText === '☀️' ? 'text-amber-300' : ''}
              ${displayText === '👁' ? 'text-rose-300' : ''}
              ${displayText === '🗡️' ? 'text-rose-400' : ''}
              ${displayText === '🌹' ? 'text-rose-200' : ''}`}>
              {displayText}
            </div>
          )}

          {status === STATUS.PAUSED && (
            <div className="text-rose-500 text-sm font-medium animate-pulse mt-2">⏸ 已暫停</div>
          )}
        </div>

        {/* ── 字幕區 ── */}
        <div className="bg-slate-900/50 backdrop-blur rounded-2xl px-5 py-4 mb-6 border border-rose-900/30 min-h-[5rem] flex items-center justify-center">
          <p className="text-center text-slate-300 text-base leading-relaxed">{subtitle}</p>
        </div>

        {/* ── 控制按鈕 ── */}
        <div className="flex gap-3 mb-4">
          {status === STATUS.IDLE || status === STATUS.DONE ? (
            <button onClick={runGame}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-700 to-red-800 text-white font-bold text-lg shadow-lg shadow-rose-900/40 hover:from-rose-600 hover:to-red-700 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Play size={22} fill="currentColor" />
              {status === STATUS.DONE ? '再玩一輪' : '開始遊戲'}
            </button>
          ) : (
            <button onClick={togglePause}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
                ${status === STATUS.PAUSED
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-rose-700 to-red-800 text-white shadow-rose-900/40'}`}>
              {status === STATUS.PAUSED
                ? <><Play size={22} fill="currentColor" /> 繼續</>
                : <><Pause size={22} /> 暫停</>}
            </button>
          )}

          {status !== STATUS.IDLE && (
            <button onClick={reset}
              className="w-16 py-4 rounded-2xl bg-slate-800/80 text-slate-400 hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center border border-slate-700/50">
              <RotateCcw size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
