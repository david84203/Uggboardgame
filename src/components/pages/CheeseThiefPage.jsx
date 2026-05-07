import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Users, Music } from 'lucide-react';

/* ───── 語音工具 ───── */
function speak(text, lang = 'zh-TW') {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) { resolve(); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.9; u.pitch = 1;
    u.onend = resolve; u.onerror = reject;
    window.speechSynthesis.speak(u);
  });
}

function createDelay(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(id); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}

/* ───── BGM 音軌定義 ───── */
const BGM_TRACKS = [
  { id: 'suspense', name: '午夜懸疑', icon: '🕵️', available: true, chords: [110.00, 130.81, 164.81, 196.00], noiseFreq: 300, waveType: 'sine', lfoRate: 0, lfoDepth: 0, noiseVolume: 0.15 },
  { id: 'heartbeat', name: '心跳暗影', icon: '💓', available: true, chords: [87.31, 130.81], noiseFreq: 150, waveType: 'triangle', lfoRate: 1.2, lfoDepth: 0.8, noiseVolume: 0.08 },
  { id: 'stealth', name: '潛行腳步', icon: '🐾', available: true, chords: [261.63, 311.13, 392.00], noiseFreq: 500, waveType: 'sine', lfoRate: 4.0, lfoDepth: 0.3, noiseVolume: 0.2 },
  { id: 'eerie', name: '幽暗地窖', icon: '🕳️', available: true, chords: [98.00, 116.54, 138.59], noiseFreq: 600, waveType: 'triangle', lfoRate: 0.1, lfoDepth: 0.4, noiseVolume: 0.25 },
  { id: 'clockwork', name: '發條危機', icon: '⚙️', available: true, chords: [196.00, 233.08, 293.66], noiseFreq: 200, waveType: 'sine', lfoRate: 8.0, lfoDepth: 0.6, noiseVolume: 0.1 },
];

/* ───── 背景音樂引擎 ───── */
class AmbientMusic {
  constructor() { this.ctx = null; this.nodes = []; this.masterGain = null; this.playing = false; }

  start(track, volume = 0.3) {
    if (this.playing) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 2);
    this.masterGain.connect(this.ctx.destination);

    const freqs = track?.chords || [55.00, 65.41, 82.41, 98.00];
    const lfoRate = track?.lfoRate || 0;
    const lfoDepth = track?.lfoDepth || 0;

    let lfoGain = this.masterGain;
    
    // LFO 顫音節點 (Tremolo)
    if (lfoRate > 0) {
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = lfoRate;
      
      const lfoAmp = this.ctx.createGain();
      lfoAmp.gain.value = lfoDepth; 
      lfo.connect(lfoAmp);
      
      const tremoloNode = this.ctx.createGain();
      tremoloNode.gain.value = 1.0 - lfoDepth; // 確保不會爆音
      lfoAmp.connect(tremoloNode.gain);
      
      tremoloNode.connect(this.masterGain);
      lfoGain = tremoloNode;
      
      lfo.start();
      this.nodes.push(lfo);
    }

    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator(); 
      osc.type = track?.waveType || 'sine'; 
      osc.frequency.value = freq;
      const g = this.ctx.createGain(); 
      g.gain.value = 0.6;
      osc.connect(g); 
      g.connect(lfoGain); 
      osc.start(); 
      this.nodes.push(osc);
      
      const osc2 = this.ctx.createOscillator(); 
      osc2.type = 'triangle'; 
      osc2.frequency.value = freq * 1.5; // 五度音程增加懸疑感
      const g2 = this.ctx.createGain(); 
      g2.gain.value = 0.2;
      osc2.connect(g2); 
      g2.connect(lfoGain); 
      osc2.start(); 
      this.nodes.push(osc2);
    });

    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0); 
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource(); 
    noise.buffer = buf; 
    noise.loop = true;
    
    const filt = this.ctx.createBiquadFilter(); 
    filt.type = 'lowpass'; 
    filt.frequency.value = track?.noiseFreq || 150;
    
    const ng = this.ctx.createGain(); 
    ng.gain.value = track?.noiseVolume || 0.1;
    
    noise.connect(filt); 
    filt.connect(ng); 
    ng.connect(this.masterGain); 
    noise.start(); 
    this.nodes.push(noise);
    
    this.playing = true;
  }

  setVolume(v) { 
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.3); 
    }
  }
  pause() { this.ctx?.suspend(); }
  resume() { this.ctx?.resume(); }

  stop() {
    if (!this.playing) return;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }
    setTimeout(() => { this.nodes.forEach(n => { try { n.stop(); } catch {} }); this.nodes = []; this.ctx?.close(); this.ctx = null; this.masterGain = null; }, 1200);
    this.playing = false;
  }
}

/* ───── 狀態 ───── */
const STATUS = { IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', DONE: 'done' };

export default function CheeseThiefPage() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [actionDuration, setActionDuration] = useState(8);
  const [playerCount, setPlayerCount] = useState(6);
  const [display, setDisplay] = useState('🧀');
  const [subtitle, setSubtitle] = useState('按下「開始遊戲」進入夜晚階段');
  const [currentStep, setCurrentStep] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [bgmTrackId, setBgmTrackId] = useState('suspense');

  const abortRef = useRef(null);
  const pauseRef = useRef({ paused: false, resolve: null });
  const musicRef = useRef(new AmbientMusic());

  const checkPause = useCallback(() => {
    if (!pauseRef.current.paused) return Promise.resolve();
    return new Promise(r => { pauseRef.current.resolve = r; });
  }, []);

  const sayAndWait = useCallback(async (text, signal) => {
    await checkPause();
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    setSubtitle(text);
    window.speechSynthesis.cancel();
    musicRef.current.setVolume(0.1);
    await speak(text);
    musicRef.current.setVolume(0.3);
    await checkPause();
  }, [checkPause]);

  const speakCountdown = useCallback(async (signal) => {
    for (let s = 5; s >= 1; s--) {
      await checkPause();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      setCountdown(s);
      window.speechSynthesis.cancel();
      musicRef.current.setVolume(0.1);
      await speak(String(s));
      musicRef.current.setVolume(0.3);
      await createDelay(300, signal);
    }
    setCountdown(null);
  }, [checkPause]);

  const hasAccomplice = playerCount >= 6;
  const totalSteps = hasAccomplice ? 9 : 8; // 0=moon 1-6=clocks 7=accomplice? 7or8=sun

  /* ───── 共犯階段 ───── */
  const runAccomplicePhase = useCallback(async (signal) => {
    setCurrentStep(7);
    setDisplay('🤝');

    await sayAndWait('所有人伸出右手。', signal);
    await createDelay(1500, signal);

    if (playerCount === 6) {
      await sayAndWait('奶酪大盜睜眼，並輕觸一位玩家，他將成為共犯。', signal);
      setSubtitle('⏱ 奶酪大盜選擇共犯中...');
      await speakCountdown(signal);
      await sayAndWait('被選為共犯的玩家睜眼，與奶酪大盜相認。', signal);
      setSubtitle('⏱ 共犯與大盜相認中...');
      await speakCountdown(signal);
    } else if (playerCount === 7) {
      await sayAndWait('奶酪大盜睜眼，並輕觸兩位玩家，他們將成為共犯。', signal);
      setSubtitle('⏱ 奶酪大盜選擇共犯中...');
      await speakCountdown(signal);
      await sayAndWait('請奶酪大盜閉眼。被選為共犯的玩家睜眼相認。', signal);
      setSubtitle('⏱ 共犯相認中...');
      await speakCountdown(signal);
    } else {
      await sayAndWait('奶酪大盜睜眼，並輕觸兩位玩家，他們將成為共犯。', signal);
      setSubtitle('⏱ 奶酪大盜選擇共犯中...');
      await speakCountdown(signal);
      await sayAndWait('被選為共犯的玩家睜眼，與奶酪大盜相認。', signal);
      setSubtitle('⏱ 共犯與大盜相認中...');
      await speakCountdown(signal);
    }

    await sayAndWait('所有玩家閉眼。', signal);
    await createDelay(2000, signal);
  }, [playerCount, sayAndWait, speakCountdown]);

  /* ───── 主流程 ───── */
  const runGame = useCallback(async () => {
    const ac = new AbortController(); abortRef.current = ac; const signal = ac.signal;
    setStatus(STATUS.RUNNING); setCountdown(null); pauseRef.current.paused = false;

    const track = BGM_TRACKS.find(t => t.id === bgmTrackId);
    if (bgmEnabled) musicRef.current.start(track, 0.3);

    try {
      setDisplay('🌙'); setCurrentStep(0);
      await sayAndWait('天黑請閉眼，所有人請閉上眼睛。', signal);
      await createDelay(3000, signal);

      for (let i = 1; i <= 6; i++) {
        await checkPause();
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
        setCurrentStep(i); setDisplay(`${i} 點鐘`);
        await sayAndWait(`${i} 點鐘的玩家，請睜開眼睛，執行你的行動。`, signal);
        const silentTime = Math.max(0, (actionDuration - 5)) * 1000;
        if (silentTime > 0) await createDelay(silentTime, signal);
        await checkPause();
        setSubtitle('⏱ 倒數計時...');
        await speakCountdown(signal);
        await sayAndWait(`${i} 點鐘的玩家，請閉上眼睛。`, signal);
        await createDelay(2000, signal);
      }

      if (hasAccomplice) await runAccomplicePhase(signal);

      setCurrentStep(hasAccomplice ? 8 : 7); setDisplay('☀️');
      await sayAndWait('天亮了，所有人請睜開眼睛。', signal);
      musicRef.current.stop();
      setStatus(STATUS.DONE); setSubtitle('本回合結束，可按重置再玩一輪');
    } catch (err) { if (err.name !== 'AbortError') console.error(err); }
  }, [actionDuration, bgmEnabled, bgmTrackId, hasAccomplice, sayAndWait, checkPause, speakCountdown, runAccomplicePhase]);

  const togglePause = useCallback(() => {
    if (status !== STATUS.RUNNING && status !== STATUS.PAUSED) return;
    if (!pauseRef.current.paused) {
      pauseRef.current.paused = true; window.speechSynthesis.pause(); musicRef.current.pause(); setStatus(STATUS.PAUSED);
    } else {
      pauseRef.current.paused = false; window.speechSynthesis.resume(); musicRef.current.resume();
      pauseRef.current.resolve?.(); pauseRef.current.resolve = null; setStatus(STATUS.RUNNING);
    }
  }, [status]);

  const reset = useCallback(() => {
    abortRef.current?.abort(); window.speechSynthesis.cancel(); musicRef.current.stop();
    pauseRef.current = { paused: false, resolve: null };
    setStatus(STATUS.IDLE); setDisplay('🧀'); setSubtitle('按下「開始遊戲」進入夜晚階段'); setCurrentStep(0); setCountdown(null);
  }, []);

  useEffect(() => () => { abortRef.current?.abort(); window.speechSynthesis.cancel(); musicRef.current.stop(); }, []);

  const isRunningOrPaused = status === STATUS.RUNNING || status === STATUS.PAUSED;

  /* 進度點 label */
  const dots = Array.from({ length: totalSteps }, (_, i) => {
    if (i === 0) return '🌙';
    if (i <= 6) return String(i);
    if (hasAccomplice && i === 7) return '🤝';
    return '☀️';
  });

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col min-h-dvh">

        <div className="text-center mb-4">
          <h2 className="text-2xl font-extrabold tracking-wider">🧀 奶酪大盜</h2>
          <p className="text-slate-400 text-sm mt-1">Cheese Thief · 語音旁白系統</p>
        </div>

        {/* ── 設定區 ── */}
        {status === STATUS.IDLE && (
          <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 mb-6 border border-slate-700/50 space-y-5">

            {/* 人數 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">遊戲人數</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 6, 7, 8].map(n => (
                  <button key={n} onClick={() => setPlayerCount(n)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${playerCount === n
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-700/60 text-slate-400 hover:bg-slate-600'}`}>
                    {n} 人
                  </button>
                ))}
              </div>
              {playerCount >= 6 && (
                <p className="text-xs text-cyan-400/70 mt-2">
                  👥 {playerCount} 人模式：含共犯階段（{playerCount === 6 ? '1 名共犯，與大盜相認' : playerCount === 7 ? '2 名共犯，共犯互認但不知大盜' : '2 名共犯，與大盜相認'}）
                </p>
              )}
              {playerCount === 5 && (
                <p className="text-xs text-slate-500 mt-2">👤 5 人基本模式，無共犯階段</p>
              )}
            </div>

            {/* 行動時間 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={18} className="text-amber-400" />
                <span className="text-sm font-medium text-slate-300">行動停留時間</span>
                <span className="ml-auto text-amber-400 font-bold text-lg">{actionDuration} 秒</span>
              </div>
              <input type="range" min={5} max={15} step={1} value={actionDuration}
                onChange={e => setActionDuration(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-amber-400" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5 秒</span><span>10 秒</span><span>15 秒</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">⏱ 最後 5 秒會自動語音倒數提醒</p>
            </div>

            {/* BGM 選擇 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Music size={18} className="text-indigo-400" />
                <span className="text-sm font-medium text-slate-300">背景音樂</span>
                <button onClick={() => setBgmEnabled(!bgmEnabled)}
                  className={`ml-auto w-12 h-7 rounded-full transition-all duration-200 relative ${bgmEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-1 transition-all duration-200 ${bgmEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              {bgmEnabled && (
                <div className="grid gap-1.5">
                  {BGM_TRACKS.map(t => (
                    <button key={t.id} disabled={!t.available}
                      onClick={() => t.available && setBgmTrackId(t.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        !t.available ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                        : bgmTrackId === t.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-700/40 text-slate-400 hover:bg-slate-700/60'}`}>
                      <span className="text-lg">{t.icon}</span>
                      <span className="font-medium">{t.name}</span>
                      {!t.available && <span className="ml-auto text-xs text-slate-600">即將推出</span>}
                      {t.available && bgmTrackId === t.id && <span className="ml-auto text-xs text-indigo-400">♪ 使用中</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 進度點 ── */}
        {isRunningOrPaused && (
          <div className="flex items-center justify-center gap-1.5 mb-4 flex-wrap">
            {dots.map((label, i) => {
              const active = i === currentStep;
              const passed = i < currentStep;
              return (
                <div key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${active ? 'bg-amber-400 text-slate-900 scale-110 shadow-lg shadow-amber-400/30'
                    : passed ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-700/50 text-slate-500'}`}>
                  {label}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 主顯示區 ── */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {countdown !== null ? (
              <div className="text-8xl sm:text-9xl font-black text-red-400 animate-pulse tabular-nums">{countdown}</div>
            ) : (
              <div className={`text-7xl sm:text-8xl font-black tracking-wider transition-all duration-500
                ${status === STATUS.PAUSED ? 'opacity-40 animate-pulse' : 'opacity-100'}
                ${display === '🌙' ? 'text-indigo-300' : ''}
                ${display === '☀️' ? 'text-amber-300' : ''}
                ${display === '🤝' ? 'text-cyan-300' : ''}
                ${!['🌙','☀️','🧀','🤝'].includes(display) ? 'text-amber-400' : ''}`}>
                {display}
              </div>
            )}
            {status === STATUS.PAUSED && <div className="mt-4 text-amber-400 text-sm font-medium animate-pulse">⏸ 已暫停</div>}
          </div>
        </div>

        {/* ── 字幕區 ── */}
        <div className="bg-slate-800/40 backdrop-blur rounded-2xl px-5 py-4 mb-6 border border-slate-700/30 min-h-[4rem] flex items-center justify-center">
          <p className="text-center text-slate-200 text-base leading-relaxed">{subtitle}</p>
        </div>

        {/* ── 控制按鈕 ── */}
        <div className="flex gap-3 mb-4">
          {status === STATUS.IDLE || status === STATUS.DONE ? (
            <button onClick={runGame}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Play size={22} fill="currentColor" />
              {status === STATUS.DONE ? '再玩一輪' : '開始遊戲'}
            </button>
          ) : (
            <button onClick={togglePause}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2
                ${status === STATUS.PAUSED ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25'}`}>
              {status === STATUS.PAUSED
                ? <><Play size={22} fill="currentColor" /> 繼續</>
                : <><Pause size={22} /> 暫停</>}
            </button>
          )}
          {status !== STATUS.IDLE && (
            <button onClick={reset}
              className="w-16 py-4 rounded-2xl bg-slate-700/80 text-slate-300 hover:bg-slate-600 active:scale-95 transition-all flex items-center justify-center">
              <RotateCcw size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
