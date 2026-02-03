'use client';
import { useState, useEffect, useRef } from 'react';

// 물고기 데이터
const FISH_TYPES: any = {
  NORMAL: { id: 'NORMAL', name: '일반', emoji: '🐟', difficulty: 3, baseValue: 50, color: '#4facfe', minG: 100, maxG: 500, time: 5 },
  RARE: { id: 'RARE', name: '희귀', emoji: '🐠', difficulty: 5, baseValue: 200, color: '#f093fb', minG: 500, maxG: 2000, time: 7 },
  EPIC: { id: 'EPIC', name: '전설', emoji: '🦈', difficulty: 8, baseValue: 1000, color: '#a18cd1', minG: 2000, maxG: 10000, time: 8 },
};

const RANDOM_NAMES = ['춘식이', '두팔이', '무식이', '덕배', '광팔이', '만수', '봉남이', '삼식삼', '철수', '존버'];
const EVENTS = [
  { text: "🌊 유조선 기름 유출! 물고기 집단 폐사!", type: "CRASH", multiplier: 0.3 },
  { text: "☢️ 방사능 오염수 방류 루머 확산!", type: "CRASH", multiplier: 0.5 },
  { text: "🎉 전국 대어 낚시 축제 개최! 수요 폭증!", type: "MOON", multiplier: 2.5 },
  { text: "📺 유명 먹방 유튜버의 전설 물고기 리뷰!", type: "MOON", multiplier: 3.5 },
];

export default function FishingGame() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<'IDLE' | 'CASTING' | 'WAITING' | 'FISHING' | 'RESULT'>('IDLE');
  
  // 게임 플레이 상태
  const [fishGauge, setFishGauge] = useState(50);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedFish, setSelectedFish] = useState<any>(null);
  const [caughtMeme, setCaughtMeme] = useState<any>(null);
  const [isJumping, setIsJumping] = useState(false);

  // 유저 데이터
  const [inventory, setInventory] = useState<any[]>([]);
  const [coins, setCoins] = useState(1000);
  const [stamina, setStamina] = useState(3);
  
  // 마켓 & 트레이딩
  const [marketPrices, setMarketPrices] = useState<any>({ NORMAL: 50, RARE: 200, EPIC: 1000 });
  const [priceHistory, setPriceHistory] = useState<any>({ NORMAL: [], RARE: [], EPIC: [] });
  const [tradingTarget, setTradingTarget] = useState<any>(null);
  const [marketEvent, setMarketEvent] = useState<string | null>(null);

  // 게이지 참조용 Ref
  const gaugeRef = useRef(50);

  useEffect(() => {
    setMounted(true);
    const savedInv = localStorage.getItem('fish_inv_scroll_fix');
    if (savedInv) setInventory(JSON.parse(savedInv));
  }, []);

  // 게이지 동기화
  useEffect(() => {
    gaugeRef.current = fishGauge;
  }, [fishGauge]);

  // 마켓 & 채비 로직
  useEffect(() => {
    if (!mounted) return;
    const marketInterval = setInterval(() => {
      setMarketPrices((prev: any) => {
        const nextPrices = { ...prev };
        const nextHistory = { ...priceHistory };
        let eventMultiplier = 1;
        
        if (Math.random() < 0.02) {
          const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
          setMarketEvent(ev.text);
          eventMultiplier = ev.multiplier;
          setTimeout(() => setMarketEvent(null), 5000);
        }

        Object.keys(FISH_TYPES).forEach(type => {
          const volatility = (Math.random() - 0.5) * (nextPrices[type] * 0.3);
          nextPrices[type] = Math.max(10, Math.floor((nextPrices[type] + volatility) * eventMultiplier));
          nextHistory[type] = [...(nextHistory[type] || []), nextPrices[type]].slice(-20);
        });
        setPriceHistory(nextHistory);
        return nextPrices;
      });
    }, 2000);

    const staminaInterval = setInterval(() => setStamina(prev => Math.min(3, prev + 1)), 60000);
    return () => { clearInterval(marketInterval); clearInterval(staminaInterval); };
  }, [mounted, priceHistory]);

  // 낚시 타이머 로직
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (gameState === 'FISHING' && selectedFish) {
      timer = setInterval(() => {
        setFishGauge(prev => {
          const next = prev - selectedFish.difficulty;
          if (next <= 0) {
            setGameState('RESULT');
            return 0;
          }
          return next;
        });

        setTimeLeft(prev => {
          const next = prev - 0.1;
          if (next <= 0.01) {
            setGameState('RESULT');
            return 0;
          }
          return next;
        });
      }, 100);
    }

    return () => clearInterval(timer);
  }, [gameState, selectedFish]);

  // 결과 판정
  useEffect(() => {
    if (gameState === 'RESULT') {
      const isSuccess = gaugeRef.current >= 70 && timeLeft <= 0.1;
      const isFailByGauge = gaugeRef.current <= 0;

      if (isSuccess && !isFailByGauge && selectedFish) {
        const weight = Math.floor(Math.random() * (selectedFish.maxG - selectedFish.minG) + selectedFish.minG);
        const result = { 
          ...selectedFish, 
          instanceId: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          displayName: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
          weight,
          typeId: selectedFish.id
        };
        setInventory(prev => [result, ...prev].slice(0, 10));
        setCaughtMeme(result);
      } else {
        setCaughtMeme(null);
      }
    }
  }, [gameState]);

  const startCasting = () => {
    if (stamina <= 0) return alert("채비가 부족합니다! 1분 기다리거나 구매하세요.");
    setStamina(s => s - 1);
    setGameState('CASTING');
    setTimeout(() => {
      setGameState('WAITING');
      setTimeout(() => {
        const type = Math.random() < 0.15 ? 'EPIC' : (Math.random() < 0.4 ? 'RARE' : 'NORMAL');
        setSelectedFish(FISH_TYPES[type]);
        setFishGauge(50);
        gaugeRef.current = 50;
        setTimeLeft(FISH_TYPES[type].time);
        setGameState('FISHING');
      }, 1500);
    }, 800);
  };

  const handleReel = () => {
    if (gameState === 'FISHING') {
      setFishGauge(p => {
        const next = Math.min(100, p + 9);
        gaugeRef.current = next;
        return next;
      });
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 100);
    }
  };

  if (!mounted) return null;

  return (
    <main style={styles.container}>
      {marketEvent && <div style={styles.newsTicker}>{marketEvent}</div>}
      
      <div style={styles.header}>
        <div style={styles.badge}>💰 {coins.toLocaleString()}</div>
        <div style={{...styles.badge, color: stamina === 0 ? '#ff6b6b' : '#51cf66'}}>🎣 채비: {stamina}/3</div>
      </div>

      <div style={styles.seaArea} onMouseDown={handleReel}>
        {gameState === 'IDLE' && (
          <div style={styles.idleView}>
            <div style={styles.bigRod}>🎣</div>
            <button onClick={startCasting} style={styles.mainBtn}>낚시 시작</button>
            <button onClick={() => coins >= 1000 && (setCoins(c => c - 1000), setStamina(3))} style={styles.buyBtn}>채비 충전 (💰1,000)</button>
          </div>
        )}
        
        {gameState === 'CASTING' && <div className="animate-pulse" style={{fontSize: '20px', fontWeight: 'bold'}}>미끼 던지는 중...</div>}
        {gameState === 'WAITING' && <div className="bobber">📍</div>}

        {gameState === 'FISHING' && (
          <div style={styles.fishingUI}>
             <div className="gauge-bg">
              <div className="gauge-fill" style={{ height: `${fishGauge}%`, backgroundColor: fishGauge >= 70 ? '#51cf66' : '#ff6b6b' }} />
              <div className="safe-zone">HIT</div>
            </div>
            <div className={`fish-action ${isJumping ? 'jump' : ''}`} style={{fontSize:'100px'}}>{selectedFish?.emoji}</div>
            <div style={styles.timer}>{(timeLeft || 0).toFixed(1)}s</div>
          </div>
        )}

        {gameState === 'RESULT' && (
          <div style={styles.resultView}>
            <h2>{caughtMeme ? `${caughtMeme.displayName} 획득!` : '놓쳤다...'}</h2>
            {caughtMeme && <p style={{fontSize: '18px', fontWeight: 600}}>⚖️ {caughtMeme.weight}g</p>}
            <button onClick={() => setGameState('IDLE')} style={styles.subBtn}>확인</button>
          </div>
        )}
      </div>

      <div style={styles.invContainer}>
        <div style={styles.inventoryGrid}>
          {inventory.map((item) => (
            <div key={item.instanceId} style={{...styles.invSlot, borderColor: item.color}} onClick={() => setTradingTarget(item)}>
              <span style={{fontSize: '28px'}}>{item.emoji}</span>
              <div className="info-tag">INFO</div>
            </div>
          ))}
          {[...Array(Math.max(0, 10 - inventory.length))].map((_, i) => (
            <div key={`empty-${i}`} style={{...styles.invSlot, opacity: 0.15, border: '1px dashed #aaa'}}></div>
          ))}
        </div>

        {tradingTarget && (
          <div style={styles.tradingPanel}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom: '10px'}}>
              <h4 style={{margin:0, fontSize: '16px'}}>{tradingTarget.displayName} ({tradingTarget.weight}g)</h4>
              <button onClick={() => setTradingTarget(null)} style={{color:'#fff', background:'none', border:'none', cursor:'pointer', fontSize: '18px'}}>✕</button>
            </div>
            <div style={styles.chartArea}>
              {(priceHistory[tradingTarget.typeId] || []).map((p: number, i: number, arr: any) => (
                <div key={i} style={{ 
                  position: 'absolute', 
                  left: `${(i / (arr.length - 1 || 1)) * 95}%`, 
                  bottom: `${Math.min(90, (p / (tradingTarget.baseValue * 4)) * 100)}%`,
                  width: '6px', height: '6px', backgroundColor: tradingTarget.color, borderRadius: '50%',
                  boxShadow: i === arr.length - 1 ? `0 0 10px 2px ${tradingTarget.color}` : 'none',
                  animation: i === arr.length - 1 ? 'ping 1s infinite' : 'none',
                  transition: 'bottom 0.5s ease'
                }} />
              ))}
            </div>
            <div style={{marginTop: '15px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontSize:'15px', fontWeight: 600}}>현재가: 💰{Math.floor(marketPrices[tradingTarget.typeId] * (tradingTarget.weight / 500)).toLocaleString()}</span>
              <button onClick={() => {
                const price = Math.floor(marketPrices[tradingTarget.typeId] * (tradingTarget.weight / 500));
                setCoins(c => c + price);
                setInventory(inv => inv.filter(i => i.instanceId !== tradingTarget.instanceId));
                setTradingTarget(null);
              }} style={styles.sellBtn}>매도하기</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

        body { 
          background: #0f172a; 
          color: #f8fafc; 
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
          margin: 0;
          overflow-y: auto; /* 스크롤 허용! */
          user-select: none;
          -webkit-user-select: none;
          padding-bottom: 50px; /* 하단 여백 추가 */
        }
        
        /* 스크롤바 디자인 (크롬/사파리) */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        
        button { font-family: 'Inter', sans-serif; user-select: none; }
        .bobber { font-size: 60px; animation: float 1s infinite ease-in-out; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(15px); } }
        .info-tag { position: absolute; font-size: 9px; background: rgba(56, 189, 248, 0.9); bottom: 4px; padding: 2px 5px; border-radius: 4px; font-weight: 800; color: #0f172a; }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }
        .gauge-bg { position: absolute; left: 24px; height: 180px; width: 14px; background: rgba(0,0,0,0.5); border-radius: 10px; border: 2px solid rgba(255,255,255,0.2); overflow: hidden; backdrop-filter: blur(4px); }
        .gauge-fill { position: absolute; bottom: 0; width: 100%; transition: height 0.1s linear; }
        .safe-zone { position: absolute; top: 0; width: 100%; height: 30%; background: rgba(81, 207, 102, 0.2); border-bottom: 1px dashed #51cf66; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 900; letter-spacing: 1px; }
        .fish-action { transition: transform 0.1s; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); }
        .fish-action.jump { transform: scale(1.2) rotate(5deg); }
        .animate-pulse { animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}

const styles: any = {
  container: { padding: '20px', maxWidth: '420px', margin: '0 auto', textAlign: 'center' },
  newsTicker: { background: '#ef4444', color: 'white', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  badge: { background: '#1e293b', padding: '10px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: '800', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '6px' },
  seaArea: { height: '360px', background: 'linear-gradient(180deg, #3b82f6 0%, #0f172a 100%)', borderRadius: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden' },
  bigRod: { fontSize: '90px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' },
  mainBtn: { padding: '16px 40px', fontSize: '18px', borderRadius: '50px', border: 'none', background: '#fbbf24', color: '#0f172a', fontWeight: '800', cursor: 'pointer', marginTop: '20px', boxShadow: '0 4px 0 #d97706', transition: 'transform 0.1s' },
  buyBtn: { display: 'block', margin: '12px auto 0', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  timer: { fontSize: '42px', fontWeight: '900', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', textShadow: '0 4px 8px rgba(0,0,0,0.4)' },
  invContainer: { marginTop: '24px', paddingBottom: '30px' },
  inventoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' },
  invSlot: { background: '#1e293b', aspectRatio: '1/1', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', cursor: 'pointer', border: '2px solid #334155', transition: 'all 0.2s' },
  tradingPanel: { marginTop: '20px', padding: '20px', background: '#1e293b', borderRadius: '24px', border: '1px solid #334155', textAlign: 'left', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  chartArea: { height: '100px', position: 'relative', borderBottom: '1px solid #475569', marginTop: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' },
  sellBtn: { padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '12px', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 0 #b91c1c' },
  subBtn: { padding: '12px 32px', borderRadius: '50px', border: 'none', background: '#51cf66', color: '#0f172a', fontWeight: '800', cursor: 'pointer', fontSize: '16px', boxShadow: '0 4px 0 #2f9e44' }
};