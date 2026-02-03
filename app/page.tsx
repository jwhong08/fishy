'use client';
import { useState, useEffect, useRef } from 'react';

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
  { text: "💎 해외 부호들의 관상용 물고기 수집 열풍!", type: "MOON", multiplier: 5.0 },
];

export default function FishingGame() {
  const [mounted, setMounted] = useState(false);
  const [gameState, setGameState] = useState<'IDLE' | 'CASTING' | 'WAITING' | 'FISHING' | 'RESULT'>('IDLE');
  const [fishGauge, setFishGauge] = useState(50);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedFish, setSelectedFish] = useState<any>(null);
  const [caughtMeme, setCaughtMeme] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [coins, setCoins] = useState(1000);
  const [stamina, setStamina] = useState(3);
  const [marketPrices, setMarketPrices] = useState<any>({ NORMAL: 50, RARE: 200, EPIC: 1000 });
  const [priceHistory, setPriceHistory] = useState<any>({ NORMAL: [], RARE: [], EPIC: [] });
  const [tradingTarget, setTradingTarget] = useState<any>(null);
  const [marketEvent, setMarketEvent] = useState<string | null>(null);
  const [eventMultiplier, setEventMultiplier] = useState(1);
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [isHamsterParty, setIsHamsterParty] = useState(false);

  const gaugeRef = useRef(50);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('fish_game_v_ultra');
    if (saved) {
      const parsed = JSON.parse(saved);
      setInventory(parsed.inventory || []);
      setCoins(parsed.coins || 1000);
      setBonusMultiplier(parsed.bonusMultiplier || 1);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('fish_game_v_ultra', JSON.stringify({ inventory, coins, bonusMultiplier }));
    }
  }, [inventory, coins, bonusMultiplier, mounted]);

  // 가격 변동 시스템
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.02 && !marketEvent) {
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        setMarketEvent(ev.text);
        setEventMultiplier(ev.multiplier);
        setTimeout(() => { setMarketEvent(null); setEventMultiplier(1); }, 7000);
      }
      setMarketPrices((prev: any) => {
        const next = { ...prev };
        const history = { ...priceHistory };
        Object.keys(FISH_TYPES).forEach(type => {
          const vol = (Math.random() - 0.5) * (next[type] * 0.2);
          next[type] = Math.max(10, Math.floor((next[type] + vol) * eventMultiplier));
          history[type] = [...(history[type] || []), next[type]].slice(-20);
        });
        setPriceHistory(history);
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [mounted, priceHistory, eventMultiplier, marketEvent]);

  // 낚시 타이머 로직
  useEffect(() => {
    let timer: any;
    if (gameState === 'FISHING' && selectedFish) {
      timer = setInterval(() => {
        setFishGauge(p => { const n = p - selectedFish.difficulty; gaugeRef.current = n; return n <= 0 ? 0 : n; });
        setTimeLeft(p => {
          const next = p - 0.1;
          if (next <= 0) { setGameState('RESULT'); return 0; }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [gameState, selectedFish]);

  useEffect(() => {
    if (gameState === 'RESULT' && gaugeRef.current >= 70 && !caughtMeme) {
      const res = { ...selectedFish, instanceId: Date.now().toString(), weight: Math.floor(Math.random() * 800 + 200), displayName: RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)], typeId: selectedFish.id };
      setInventory(prev => [res, ...prev].slice(0, 10));
      setCaughtMeme(res);
    }
  }, [gameState]);

  const startFishing = () => {
    if(stamina <= 0) return alert("채비 부족!");
    setStamina(s => s - 1);
    setCaughtMeme(null);
    setGameState('CASTING');
    setTimeout(() => {
      setGameState('WAITING');
      setTimeout(() => {
        const type = Math.random() < 0.1 ? 'EPIC' : (Math.random() < 0.3 ? 'RARE' : 'NORMAL');
        setSelectedFish(FISH_TYPES[type]);
        setTimeLeft(FISH_TYPES[type].time);
        setFishGauge(50);
        setGameState('FISHING');
      }, 1500);
    }, 1000);
  };

  if (!mounted) return null;

  return (
    <main style={styles.container}>
      {isHamsterParty && (
        <div style={styles.hamsterOverlay}>
          <div className="hamster-dance">🐹🕺💃🐹</div>
          <div style={{fontSize:'22px', fontWeight:'900', color:'#fbbf24', marginTop: '20px'}}>신비로운 힘이 깃듭니다!</div>
        </div>
      )}

      {marketEvent && <div style={styles.newsTicker}>{marketEvent}</div>}
      
      <div style={styles.header}>
        <div style={styles.badge}>💰 {coins.toLocaleString()}</div>
        <div style={{...styles.badge, color: '#fbbf24'}}>⚡ x{bonusMultiplier.toFixed(1)}</div>
        <div style={styles.badge}>🎣 {stamina}/3</div>
      </div>

      <div style={styles.seaArea} onMouseDown={() => gameState === 'FISHING' && setFishGauge(p => Math.min(100, p+10))}>
        {gameState === 'IDLE' && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'80px'}}>🎣</div>
            <button onClick={startFishing} style={styles.mainBtn}>낚시 시작</button>
          </div>
        )}
        {gameState === 'CASTING' && <div className="animate-pulse">미끼 던지는 중...</div>}
        {gameState === 'WAITING' && <div className="bobber">📍</div>}
        
        {gameState === 'FISHING' && (
           <div style={{display:'flex', alignItems:'center', gap:'30px', position:'relative'}}>
             {/* 복구된 게이지 및 기준선 */}
             <div className="gauge-container">
               <div className="gauge-bg">
                 <div className="gauge-fill" style={{ height: `${fishGauge}%`, backgroundColor: fishGauge >= 70 ? '#51cf66' : '#ff6b6b' }} />
                 <div className="hit-line" /> {/* 70% 기준선 */}
               </div>
               <span style={{fontSize:'10px', fontWeight:'bold', color: fishGauge >= 70 ? '#51cf66' : '#fff'}}>HIT</span>
             </div>
             <div className="fish-jump" style={{fontSize:'100px'}}>{selectedFish?.emoji}</div>
             <div style={styles.timer}>{timeLeft.toFixed(1)}s</div>
           </div>
        )}
        
        {gameState === 'RESULT' && (
          <div>
            <h2 style={{fontSize: '28px'}}>{caughtMeme ? `${caughtMeme.displayName}!` : '실패...'}</h2>
            <button onClick={() => setGameState('IDLE')} style={styles.subBtn}>확인</button>
          </div>
        )}
      </div>

      <div style={styles.invContainer}>
        <div style={styles.inventoryGrid}>
          {inventory.map(item => (
            <div key={item.instanceId} style={{...styles.invSlot, borderColor: item.color}} onClick={() => setTradingTarget(item)}>
              <span style={{fontSize:'24px'}}>{item.emoji}</span>
            </div>
          ))}
          {[...Array(10 - inventory.length)].map((_, i) => <div key={i} style={styles.emptySlot} />)}
        </div>

        {tradingTarget && (
          <div style={styles.tradingPanel}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                <span style={{fontWeight:'900'}}>{tradingTarget.displayName}</span>
                <button onClick={() => setTradingTarget(null)} style={{background:'none', border:'none', color:'#fff', cursor:'pointer'}}>✕</button>
            </div>
            {/* 복구된 그래프 및 점(Point) */}
            <div className="chart-wrapper">
              {priceHistory[tradingTarget.typeId]?.map((p:any, i:number) => (
                <div key={i} className="chart-dot" style={{
                  left: `${i * 5}%`,
                  bottom: `${Math.min(90, (p / (FISH_TYPES[tradingTarget.typeId].baseValue * 5)) * 100)}%`,
                  backgroundColor: tradingTarget.color,
                  boxShadow: i === 19 ? `0 0 8px ${tradingTarget.color}` : 'none'
                }} />
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'15px'}}>
              <span style={{fontSize:'18px', fontWeight:'bold'}}>💰{Math.floor(marketPrices[tradingTarget.typeId] * (tradingTarget.weight/500) * bonusMultiplier).toLocaleString()}</span>
              <button onClick={() => { 
                  setCoins(c => c + Math.floor(marketPrices[tradingTarget.typeId] * (tradingTarget.weight/500) * bonusMultiplier)); 
                  setInventory(inv => inv.filter(i => i.instanceId !== tradingTarget.instanceId)); 
                  setTradingTarget(null); 
              }} style={styles.sellBtn}>매도하기</button>
            </div>
          </div>
        )}

        <div style={styles.mysteryBox} onClick={() => {
            if (coins < 10000) return alert("돈이 부족합니다!");
            setCoins(c => c - 10000);
            setBonusMultiplier(m => m + 0.5);
            setIsHamsterParty(true);
            setTimeout(() => setIsHamsterParty(false), 5000);
        }}>
          <div style={{fontSize: '40px'}}>🎁</div>
          <div style={{textAlign: 'left'}}>
            <div style={{fontWeight: '900', fontSize: '16px'}}>미스터리 선물</div>
            <div style={{fontSize: '12px', color: '#fbbf24'}}>가격: 💰10,000 | 행운을 시험하세요</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body { background: #0f172a; color: white; font-family: 'Inter', sans-serif; margin:0; }
        .gauge-container { display: flex; flexDirection: column; align-items: center; gap: 5px; }
        .gauge-bg { height: 180px; width: 14px; background: rgba(0,0,0,0.6); border-radius: 7px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.2); }
        .gauge-fill { position: absolute; bottom: 0; width: 100%; transition: height 0.1s linear; }
        .hit-line { position: absolute; bottom: 70%; width: 100%; height: 2px; background: #51cf66; box-shadow: 0 0 10px #51cf66; z-index: 2; }
        .chart-wrapper { height: 80px; width: 100%; background: rgba(0,0,0,0.3); border-radius: 10px; position: relative; overflow: hidden; border-bottom: 1px solid #334155; }
        .chart-dot { position: absolute; width: 5px; height: 5px; border-radius: 50%; transition: bottom 0.3s ease; }
        .bobber { font-size: 60px; animation: float 1s infinite ease-in-out; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(15px); } }
        .fish-jump { animation: jump 0.6s infinite alternate; }
        @keyframes jump { from { transform: translateY(0); } to { transform: translateY(-20px); } }
        .hamster-dance { font-size: 80px; animation: party 0.4s infinite; }
        @keyframes party { 0% { transform: scale(1); } 50% { transform: scale(1.2) rotate(10deg); } 100% { transform: scale(1) rotate(-10deg); } }
        .animate-pulse { animation: pulse 1.5s infinite; font-weight: bold; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </main>
  );
}

const styles: any = {
  container: { padding: '20px', maxWidth: '420px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  badge: { background: '#1e293b', padding: '10px 14px', borderRadius: '15px', fontSize: '12px', fontWeight: '900', border: '1px solid #475569' },
  seaArea: { height: '340px', background: 'linear-gradient(180deg, #3b82f6 0%, #0f172a 100%)', borderRadius: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: '4px solid rgba(255,255,255,0.1)' },
  mainBtn: { padding: '15px 35px', fontSize: '18px', borderRadius: '50px', border: 'none', background: '#fbbf24', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 0 #d97706' },
  invContainer: { marginTop: '20px', paddingBottom: '40px' },
  inventoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' },
  invSlot: { background: '#1e293b', aspectRatio: '1/1', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid #334155', cursor: 'pointer' },
  emptySlot: { background: '#1e293b', aspectRatio: '1/1', borderRadius: '14px', opacity: 0.2, border: '1px dashed #aaa' },
  tradingPanel: { marginTop: '15px', padding: '20px', background: '#1e293b', borderRadius: '25px', border: '1px solid #3b82f6', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  sellBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900' },
  mysteryBox: { marginTop: '15px', padding: '15px', background: 'linear-gradient(45deg, #1e293b, #334155)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '2px solid #fbbf24', cursor: 'pointer' },
  hamsterOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  timer: { fontSize: '36px', fontWeight: '900' },
  subBtn: { padding: '12px 30px', borderRadius: '25px', border: 'none', background: '#51cf66', fontWeight: '900', cursor: 'pointer' },
  newsTicker: { background: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '10px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }
};