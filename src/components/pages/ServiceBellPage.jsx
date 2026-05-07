import React, { useState, useRef, useEffect } from 'react';
import { Bell, Settings2, Play } from 'lucide-react';

const SOUND_OPTIONS = [
  { id: 'bell', label: '經典鈴聲' },
  { id: 'horn', label: '喇叭聲' },
  { id: 'laser', label: '雷射槍' },
  { id: 'meow', label: '喵喵聲' },
  { id: 'explosion', label: '爆炸聲' },
  { id: 'boing', label: 'ㄉㄨㄞ～' },
];

export default function ServiceBellPage() {
  const [selectedSound, setSelectedSound] = useState('bell');
  const [isPressed, setIsPressed] = useState(false);
  const audioCtxRef = useRef(null);
  const activeNodesRef = useRef([]);

  // 初始化 AudioContext
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    };
    window.addEventListener('touchstart', initAudio, { once: true });
    window.addEventListener('click', initAudio, { once: true });
    return () => {
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('click', initAudio);
    };
  }, []);

  const playSound = (soundId = selectedSound) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // 強制中斷上一次的聲音
    activeNodesRef.current.forEach(node => {
      try { node.stop(); } catch(e) {}
      try { node.disconnect(); } catch(e) {}
    });
    activeNodesRef.current = [];

    const t = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    activeNodesRef.current.push(masterGain);

    switch (soundId) {
      case 'bell': {
        // 金屬服務鈴 (Halli Galli 風格)
        // 使用非整數倍的諧波來製造金屬碰撞的清脆感
        const partials = [
          { f: 1600, dec: 2.5, amp: 1.0 },
          { f: 2350, dec: 2.0, amp: 0.7 },
          { f: 3400, dec: 1.5, amp: 0.5 },
          { f: 4800, dec: 1.0, amp: 0.3 },
          { f: 6500, dec: 0.6, amp: 0.1 }
        ];
        
        partials.forEach(p => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          activeNodesRef.current.push(osc);
          osc.type = 'sine';
          osc.frequency.value = p.f;
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          gain.gain.setValueAtTime(0, t);
          // 極快的金屬敲擊 Attack
          gain.gain.linearRampToValueAtTime(p.amp * 0.4, t + 0.005);
          // 長時間的共鳴 Decay (讓聲音自然消散)
          gain.gain.exponentialRampToValueAtTime(0.001, t + p.dec);
          
          osc.start(t);
          osc.stop(t + p.dec);
        });
        
        // 加上一個短促的機械敲擊聲(Clapper click)
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        activeNodesRef.current.push(clickOsc);
        clickOsc.type = 'square';
        clickOsc.frequency.value = 6000;
        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);
        clickGain.gain.setValueAtTime(0, t);
        clickGain.gain.linearRampToValueAtTime(0.1, t + 0.002);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        clickOsc.start(t);
        clickOsc.stop(t + 0.05);
        break;
      }
      case 'horn': {
        // 模擬喇叭 (雙頻率鋸齒波，加長持續時間)
        [350, 450].forEach(f => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          activeNodesRef.current.push(osc);
          osc.type = 'sawtooth';
          osc.frequency.value = f;
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.2, t + 0.1);
          gain.gain.setValueAtTime(0.2, t + 0.4);
          gain.gain.linearRampToValueAtTime(0.001, t + 0.8);
          
          osc.start(t);
          osc.stop(t + 0.8);
        });
        break;
      }
      case 'laser': {
        // 科幻雷射槍 (極速下墜的方波滑音，適合連按)
        const duration = 0.35;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        activeNodesRef.current.push(osc);
        
        // 使用方波能產生經典的 8-bit 科幻感
        osc.type = 'square';
        
        // 音高急遽下降，製造出經典的「Pew! Pew!」聲
        osc.frequency.setValueAtTime(3000, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + duration);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        // 音量包絡線：極快的起音，然後迅速消散
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        
        osc.start(t);
        osc.stop(t + duration);
        break;
      }
      case 'meow': {
        // 模擬更真實且拉長的貓叫聲 (Formant Filter + Vibrato)
        const duration = 1.8; // 拉長到 1.8 秒
        
        // 主發聲器 (鋸齒波有豐富的諧波，適合模擬聲帶)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        
        // 音高滑動 (Pitch Envelope)
        // 模擬貓叫的音調變化：起音 -> 稍微上揚 -> 緩慢下降
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(700, t + 0.3); // 喵(上揚)
        osc.frequency.exponentialRampToValueAtTime(400, t + 1.2); // 嗚(下降)
        osc.frequency.exponentialRampToValueAtTime(250, t + duration); // 尾音
        
        // 抖音 (Vibrato) 讓聲音更有生物感
        const vibratoOsc = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        vibratoOsc.type = 'sine';
        vibratoOsc.frequency.value = 5.5; // 5.5Hz 的抖音
        vibratoGain.gain.value = 15; // 音高變化幅度
        vibratoOsc.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibratoOsc.start(t);
        vibratoOsc.stop(t + duration);
        activeNodesRef.current.push(vibratoOsc);

        // 模擬口腔形狀變化的濾波器 (Formant Filter)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 8; // 讓共鳴感更明顯
        
        // M(悶) -> E(亮) -> O(圓) -> W(悶)
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.exponentialRampToValueAtTime(2500, t + 0.3);
        filter.frequency.exponentialRampToValueAtTime(1000, t + 0.8);
        filter.frequency.exponentialRampToValueAtTime(300, t + duration);

        const gain = ctx.createGain();
        activeNodesRef.current.push(osc);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        
        // 音量包絡線 (Volume Envelope)
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.8, t + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.3, t + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, t + duration);
        
        osc.start(t);
        osc.stop(t + duration);
        break;
      }
      case 'explosion': {
        // 經典且有力的「蹦！！！」 (強烈的白噪音 + 低頻重擊)
        const duration = 3.5; // 延長殘響時間
        
        // --- 1. 物理打擊感 (Transient Punch) ---
        // 用一個快速往下降的方波製造一瞬間的「衝擊」感
        const punchOsc = ctx.createOscillator();
        const punchGain = ctx.createGain();
        activeNodesRef.current.push(punchOsc);
        punchOsc.type = 'square';
        punchOsc.frequency.setValueAtTime(150, t);
        punchOsc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
        
        punchOsc.connect(punchGain);
        punchGain.connect(masterGain);
        punchGain.gain.setValueAtTime(0, t);
        punchGain.gain.linearRampToValueAtTime(1.5, t + 0.01);
        punchGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        punchOsc.start(t);
        punchOsc.stop(t + 0.2);

        // --- 2. 爆炸主體 (Heavy Noise Boom) ---
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1);
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        activeNodesRef.current.push(noise);

        const filter = ctx.createBiquadFilter();
        const noiseGain = ctx.createGain();
        
        // 低通濾波器把白噪音的高頻濾掉，留下「轟」的重量感
        filter.type = 'lowpass';
        filter.Q.value = 1.5;
        filter.frequency.setValueAtTime(1200, t); // 起始頻率稍高，帶出破裂感
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.6); // 前段迅速掉到100Hz，變得很沉
        filter.frequency.exponentialRampToValueAtTime(30, t + duration); // 尾音慢慢沉到30Hz
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        
        // 音量包絡線：一開始極大聲，然後有較長的轟隆殘響
        noiseGain.gain.setValueAtTime(3.0, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.2, t + 1.0); // 1秒時還有一定音量
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration); // 緩慢消散
        
        noise.start(t);
        break;
      }
      case 'boing': {
        // 模擬ㄉㄨㄞ ㄉㄨㄞ (更長的彈簧滑音)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        activeNodesRef.current.push(osc);
        osc.type = 'triangle';
        
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.8);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.6, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        
        osc.start(t);
        osc.stop(t + 0.8);
        break;
      }
    }
  };

  const handlePressDown = (e) => {
    // 避免滑鼠與觸控重複觸發
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    setIsPressed(true);
    playSound();
  };

  const handlePressUp = () => {
    setIsPressed(false);
  };

  return (
    <div style={{ maxWidth: 512, margin: '0 auto', padding: '16px 16px 60px', minHeight: 'calc(100vh - 60px)', background: '#F5F2EB', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, color: '#1c1917', margin: '16px 0 20px', letterSpacing: 1 }}>搶答鈴</h2>

      {/* 音效設定 */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontWeight: 700, color: '#57534e' }}>
          <Settings2 size={18} />
          音效設定
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SOUND_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => { setSelectedSound(opt.id); playSound(opt.id); }}
              style={{
                flex: '1 1 calc(33% - 8px)', minWidth: 80, padding: '8px 4px', borderRadius: 10,
                background: selectedSound === opt.id ? '#fef3c7' : '#f5f5f4',
                border: selectedSound === opt.id ? '2px solid #f59e0b' : '2px solid transparent',
                color: selectedSound === opt.id ? '#d97706' : '#78716c',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 鈴鐺按鈕區 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        
        {/* 鈴鐺本體 */}
        <div 
          onMouseDown={handlePressDown}
          onMouseUp={handlePressUp}
          onMouseLeave={handlePressUp}
          onTouchStart={handlePressDown}
          onTouchEnd={handlePressUp}
          onTouchCancel={handlePressUp}
          style={{
            position: 'relative',
            width: 300, height: 300,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            transform: isPressed ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.05s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* 金屬底座 */}
          <div style={{
            position: 'absolute', bottom: 15, left: '5%', width: '90%', height: 45,
            background: 'linear-gradient(to bottom, #d6d3d1, #78716c)',
            borderRadius: '50% / 100%',
            boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
          }} />

          {/* 鈴鐺圓頂 */}
          <div style={{
            position: 'absolute', bottom: 35, left: '10%', width: '80%', height: 165,
            background: 'linear-gradient(135deg, #fcd34d, #f59e0b, #b45309)',
            borderTopLeftRadius: '150px 165px',
            borderTopRightRadius: '150px 165px',
            boxShadow: 'inset -8px -8px 25px rgba(0,0,0,0.2), inset 15px 15px 30px rgba(255,255,255,0.6)',
            overflow: 'hidden'
          }}>
             {/* 亮面反光 */}
            <div style={{ position: 'absolute', top: 15, left: 20, width: 45, height: 90, background: 'rgba(255,255,255,0.5)', borderRadius: '50%', transform: 'rotate(-20deg)', filter: 'blur(6px)' }} />
          </div>

          {/* 頂部按鈕 (會被往下壓) */}
          <div style={{
            position: 'absolute', top: isPressed ? 85 : 65, left: '42%', width: '16%', height: 40,
            background: 'linear-gradient(to right, #1c1917, #44403c, #1c1917)',
            borderRadius: '12px 12px 0 0',
            transition: 'top 0.05s',
            zIndex: -1
          }} />
          
          {/* 按鈕頂部圓盤 */}
          <div style={{
            position: 'absolute', top: isPressed ? 70 : 50, left: '35%', width: '30%', height: 22,
            background: 'linear-gradient(to bottom, #a8a29e, #57534e)',
            borderRadius: '50%',
            transition: 'top 0.05s'
          }} />

        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: '#a8a29e', marginTop: 16 }}>
        點擊上方設定可試聽音效。<br/>
        支援多點觸控，點擊鈴鐺圖示搶答！
      </p>
    </div>
  );
}
