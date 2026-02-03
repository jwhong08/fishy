'use client';
import { useState, useEffect, useRef } from 'react';

const FISH_TYPES: any = {
  NORMAL: { id: 'NORMAL', name: '일반', emoji: '🐟', difficulty: 3, baseValue: 50, color: '#4facfe', minG: 100, maxG: 500, time: 5 },
  RARE: { id: 'RARE', name: '희귀', emoji: '🐠', difficulty: 5, baseValue: 200, color: '#f093fb', minG: 500, maxG: 2000, time: 7 },
  EPIC: { id: 'EPIC', name: '전설', emoji: '🦈', difficulty: 8, baseValue: 1000, color: '#a18cd1', minG: 2000, maxG: 10000, time: 8 },
};

const RANDOM_NAMES = ['춘식이', '두팔이', '무식이', '덕배', '광팔이', '만수', '봉남이', '삼식삼', '철수', '존버'];

// 🌪️ 다시 복구된 5개 이벤트 (정상 작동)
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

  // 🐹 햄스터 보너스
  const [bonusMultiplier, setBonusMultiplier] = useState(1);
  const [isHamsterParty, setIsHamsterParty] = useState(false);

  const gaugeRef = useRef(50);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('fish_game_vFinal');
    if (saved) {
      const parsed = JSON.parse(saved);
      setInventory(parsed.inventory || []);
      setCoins(parsed.coins || 1000);
      setBonusMultiplier(parsed.bonusMultiplier || 1);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('fish_game_vFinal', JSON.stringify({ inventory, coins, bonusMultiplier }));
    }
  }, [inventory, coins, bonusMultiplier, mounted]);

  // 낚시 중 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = (gameState === 'FISHING' || isHamsterParty) ? 'hidden' : 'auto';
  }, [gameState, isHamsterParty]);

  // 🌪️ 시장 이벤트 및 가격 변동 (복구 완료)
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      // 2% 확률로 이벤트 발생
      if (Math.random() < 0.02 && !marketEvent) {
        const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        setMarketEvent(ev.text);
        setEventMultiplier(ev.multiplier);
        setTimeout(() => {
          setMarketEvent(null);
          setEventMultiplier(1);
        }, 7000);
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

  // 낚시 로직 (생략 없이 유지)
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
    if (gameState === 'RESULT') {
      if (gaugeRef.current >= 70 && !caughtMeme) {
        const res = { ...selectedFish, instanceId: Date.now().toString(), weight: Math.floor(Math.random() * 800 + 200), displayName: RANDOM_NAMES[Math.floor(Math.random()*RANDOM_NAMES.length)], typeId: selectedFish.id };
        setInventory(prev => [res, ...prev].slice(0, 10));
        setCaughtMeme(res);
      }
    }
  }, [gameState]);

  const buyMysteryBox = () => {
    if (coins < 20000) return alert("돈이 부족합니다!");
    setCoins(c => c - 20000);
    setBonusMultiplier(m => m + 0.5);
    setIsHamsterParty(true);
    setTimeout(() => setIsHamsterParty(false), 5000);
  };

  if (!mounted) return null;

  return (
    <main ref={containerRef} style={styles.container}>
      {isHamsterParty && (
        <div style={styles.hamsterOverlay}>
          <div className="hamster-dance">🐹💃🕺🐹</div>
          <div style={{fontSize:'26px', fontWeight:'900', color:'#fbbf24', textShadow: '0 0 10px gold'}}>HAMSTER POWER UP!</div>
          <div style={{fontSize:'18px', marginTop:'10px'}}>판매 배율: {bonusMultiplier.toFixed(1)}x</div>
        </div>
      )}

      {marketEvent && <div style={styles.newsTicker}>{marketEvent}</div>}
      
      <div style={styles.header}>
        <div style={styles.badge}>💰 {coins.toLocaleString()}</div>
        <div style={{...styles.badge, color: '#fbbf24'}}>🔥 x{bonusMultiplier.toFixed(1)}</div>
        <div style={styles.badge}>🎣 {stamina}/3</div>
      </div>

      <div style={styles.seaArea} onMouseDown={() => gameState === 'FISHING' && setFishGauge(p => {const n=Math.min(100,p+10); gaugeRef.current=n; return n;})}>
        {gameState === 'IDLE' && (
          <div style={styles.idleView}>
            <div style={{fontSize:'80px'}}>🎣</div>
            <button onClick={() => {
                if(stamina <= 0) return alert("채비 부족!");
                setStamina(s=>s-1); setGameState('CASTING'); setCaughtMeme(null);
                setTimeout(()=>setGameState('WAITING'), 1000); 
                setTimeout(()=>{
                    const type = Math.random() < 0.1 ? 'EPIC' : (Math.random() < 0.3 ? 'RARE' : 'NORMAL');
                    setSelectedFish(FISH_TYPES[type]); setTimeLeft(FISH_TYPES[type].time); setFishGauge(50); setGameState('FISHING')
                }, 2500)
            }} style={styles.mainBtn}>낚시 시작</button>
          </div>
        )}
        {gameState === 'FISHING' && (
           <div style={styles.fishingUI}>
             <div className="gauge-bg"><div className="gauge-fill" style={{ height: `${fishGauge}%`, backgroundColor: fishGauge >= 70 ? '#51cf66' : '#ff6b6b' }} /></div>
             <div className="fish-jump" style={{fontSize:'100px'}}>{selectedFish?.emoji}</div>
             <div style={styles.timer}>{timeLeft.toFixed(1)}s</div>
           </div>
        )}
        {gameState === 'RESULT' && (
          <div style={styles.resultView}>
            <h2>{caughtMeme ? `${caughtMeme.displayName} 획득!` : '놓쳤다...'}</h2>
            <button onClick={() => setGameState('IDLE')} style={styles.subBtn}>확인</button>
          </div>
        )}
      </div>

      <div style={styles.invContainer}>
        <div style={styles.inventoryGrid}>
          {inventory.map(item => (
            <div key={item.instanceId} style={{...styles.invSlot, borderColor: item.color}} onClick={() => setTradingTarget(item)}>
              <span style={{fontSize:'24px'}}>{item.emoji}</span>
              <div style={styles.infoTag}>INFO</div>
            </div>
          ))}
          {[...Array(10 - inventory.length)].map((_, i) => <div key={i} style={styles.emptySlot}></div>)}
        </div>

        {tradingTarget && (
          <div style={styles.tradingPanel}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
                <h4 style={{margin:0}}>{tradingTarget.displayName} ({tradingTarget.weight}g)</h4>
                <button onClick={() => setTradingTarget(null)} style={{color:'#fff', background:'none', border:'none', cursor:'pointer'}}>✕</button>
            </div>
            <div style={styles.chartArea}>
              {priceHistory[tradingTarget.typeId]?.map((p:any, i:number) => (
                <div key={i} style={{position:'absolute', left:`${i*5}%`, bottom:`${(p/(FISH_TYPES[tradingTarget.typeId].baseValue*5))*100}%`, width:'4px', height:'4px', background:tradingTarget.color, borderRadius:'50%'}} />
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px'}}>
              <span style={{fontWeight:'bold'}}>현재가: 💰{Math.floor(marketPrices[tradingTarget.typeId] * (tradingTarget.weight/500) * bonusMultiplier).toLocaleString()}</span>
              <button onClick={() => { 
                  const price = Math.floor(marketPrices[tradingTarget.typeId] * (tradingTarget.weight/500) * bonusMultiplier);
                  setCoins(c => c + price); 
                  setInventory(inv => inv.filter(i => i.instanceId !== tradingTarget.instanceId)); 
                  setTradingTarget(null); 
              }} style={styles.sellBtn}>매도하기</button>
            </div>
          </div>
        )}

        <div style={styles.mysteryBox} onClick={buyMysteryBox}>
          <div style={{fontSize: '40px'}}>🎁</div>
          <div style={{textAlign: 'left'}}>
            <div style={{fontWeight: '900', fontSize: '16px'}}>미스터리 선물</div>
            <div style={{fontSize: '12px', color: '#fbbf24'}}>가격: 💰20,000 | 배율 +0.5x 무한중첩</div>
          </div>
          <div style={styles.buyBadge}>HOT</div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { background: #0f172a; color: white; font-family: 'Inter', sans-serif; margin:0; user-select:none; -webkit-user-select:none; }
        .gauge-bg { position: absolute; left: 24px; height: 180px; width: 12px; background: rgba(0,0,0,0.5); border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.2); }
        .gauge-fill { position: absolute; bottom: 0; width: 100%; transition: height 0.1s linear; }
        .fish-jump { animation: jump 0.5s infinite alternate; }
        @keyframes jump { from { transform: translateY(0); } to { transform: translateY(-20px); } }
        .hamster-dance { font-size: 80px; animation: party 0.4s infinite; }
        @keyframes party { 0% { transform: scale(1) rotate(0); } 50% { transform: scale(1.2) rotate(10deg); } 100% { transform: scale(1) rotate(-10deg); } }
      `}</style>
    </main>
  );
}

const styles: any = {
  container: { padding: '20px', maxWidth: '420px', margin: '0 auto', textAlign: 'center', minHeight: '100vh' },
  newsTicker: { background: '#ef4444', color: 'white', padding: '12px', borderRadius: '12px', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold', animation: 'pulse 1s infinite' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', gap: '8px' },
  badge: { background: '#1e293b', padding: '10px 14px', borderRadius: '15px', fontSize: '13px', fontWeight: '900', border: '1px solid #334155' },
  seaArea: { height: '340px', background: 'linear-gradient(180deg, #3b82f6 0%, #0f172a 100%)', borderRadius: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: '4px solid rgba(255,255,255,0.1)', overflow: 'hidden' },
  mainBtn: { padding: '15px 35px', fontSize: '18px', borderRadius: '50px', border: 'none', background: '#fbbf24', color: '#0f172a', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 0 #d97706' },
  invContainer: { marginTop: '20px', paddingBottom: '40px' },
  inventoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' },
  invSlot: { background: '#1e293b', aspectRatio: '1/1', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', cursor: 'pointer', border: '2px solid #334155' },
  emptySlot: { background: '#1e293b', aspectRatio: '1/1', borderRadius: '14px', opacity: 0.2, border: '1px dashed #aaa' },
  infoTag: { position: 'absolute', bottom: '4px', fontSize: '8px', background: '#3b82f6', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' },
  tradingPanel: { marginTop: '15px', padding: '15px', background: '#1e293b', borderRadius: '20px', textAlign: 'left', border: '1px solid #3b82f6', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' },
  chartArea: { height: '70px', position: 'relative', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', marginTop: '10px' },
  sellBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' },
  mysteryBox: { marginTop: '15px', padding: '18px', background: 'linear-gradient(45deg, #1e293b, #334155)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', border: '2px solid #fbbf24', position: 'relative' },
  buyBadge: { position: 'absolute', right: '15px', background: '#fbbf24', color: '#000', padding: '2px 8px', borderRadius: '5px', fontSize: '10px', fontWeight: '900' },
  hamsterOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
  timer: { fontSize: '40px', fontWeight: '900', marginTop: '10px' },
  subBtn: { padding: '12px 30px', borderRadius: '25px', border: 'none', background: '#51cf66', color: '#0f172a', fontWeight: '900', cursor: 'pointer' }
};