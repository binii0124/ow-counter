import { useState, useEffect, useMemo, useRef } from 'react';
import { counterMap, heroNameMap } from './constants';

// API 인터페이스
interface APIHero {
  key: string;
  name: string;
  portrait: string;
  role: string;
}

type RoleFilter = 'all' | 'tank' | 'damage' | 'support';

function App() {
  const [heroes, setHeroes] = useState<APIHero[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHero, setSelectedHero] = useState<APIHero | null>(null);
  
  // 마우스 추적 상태
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. API 데이터 페칭
  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://overfast-api.tekrop.fr/heroes');
        if (!response.ok) throw new Error('API 데이터 로딩 실패');
        const data = await response.json();
        setHeroes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeroes();
  }, []);

  // 마우스 이동 핸들러
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // 2. 필터링 로직
  const filteredHeroes = useMemo(() => {
    return heroes.filter((hero) => {
      const koName = heroNameMap[hero.key] || "";
      const matchesSearch = 
        hero.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        koName.includes(searchQuery);
      return matchesSearch;
    });
  }, [heroes, searchQuery]);

  // 3. 카운터 영웅 찾기 로직
  const counters = useMemo(() => {
    if (!selectedHero || !counterMap[selectedHero.key]) return [];
    return counterMap[selectedHero.key]
      .map(key => heroes.find(h => h.key === key))
      .filter((h): h is APIHero => !!h);
  }, [selectedHero, heroes]);

  // 4. 역할군별 그룹화 로직
  const groupedHeroes = useMemo(() => {
    return {
      tank: filteredHeroes.filter(h => h.role === 'tank'),
      damage: filteredHeroes.filter(h => h.role === 'damage'),
      support: filteredHeroes.filter(h => h.role === 'support'),
    };
  }, [filteredHeroes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center overflow-hidden text-white font-sans">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="mt-4 text-white font-black text-2xl tracking-[0.3em] animate-pulse italic">LOADING...</h2>
      </div>
    );
  }

  const roleMap: Record<string, string> = {
    tank: '돌격',
    damage: '공격',
    support: '지원',
  };

  const RoleSection = ({ title, role, heroesList, colorClass }: { title: string, role: string, heroesList: APIHero[], colorClass: string }) => (
    <div className="mb-10 relative z-10">
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-1.5 h-6 ${colorClass} rounded-full`}></div>
        <h3 className="text-2xl font-black italic uppercase tracking-wider text-white flex items-baseline gap-2">
          {roleMap[role] || title}
          <span className="text-slate-500 text-sm font-normal uppercase tracking-widest ml-1">
            {title}
          </span>
          <span className="text-slate-600 text-lg font-normal ml-2">[{heroesList.length}]</span>
        </h3>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-3">
        {heroesList.map((hero) => (
          <button
            key={hero.key}
            onClick={() => setSelectedHero(hero)}
            className={`group relative w-full transition-all duration-75 ${
              selectedHero?.key === hero.key ? 'scale-110 z-20' : 'hover:scale-110 hover:z-10'
            }`}
          >
            <div className="absolute inset-[-10px] bg-orange-500/0 group-hover:bg-orange-500/20 blur-xl rounded-full transition-all duration-150 pointer-events-none" />
            
            <div className={`relative aspect-square skew-x-[-10deg] border transition-all duration-100 overflow-hidden ${
              selectedHero?.key === hero.key 
                ? 'border-orange-500 bg-orange-500/40 shadow-[0_0_30px_rgba(249,158,26,0.6)]' 
                : 'border-slate-700 bg-slate-900/60 group-hover:border-orange-400 group-hover:shadow-[0_0_20px_rgba(249,158,26,0.4)]'
            }`}>
              <img 
                src={hero.portrait} 
                alt={hero.name}
                className="absolute inset-0 w-full h-full object-cover object-top scale-[1.15] skew-x-[10deg] transition-transform duration-200 group-hover:scale-[1.25]"
                loading="lazy"
              />
            </div>
            <p className="mt-2 ml-1 text-[18px] font-black italic text-slate-300 uppercase truncate text-left group-hover:text-white transition-colors">
              {heroNameMap[hero.key] || hero.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-orange-500/30 font-sans overflow-hidden relative"
    >
      <div 
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(249, 158, 26, 0.08), transparent 80%)`
        }}
      />

      <header className="relative pt-10 pb-6 px-12 flex flex-col items-center border-b border-white/5 bg-slate-900/30 z-20 shrink-0">
        <h1 className="text-5xl font-black italic tracking-tighter text-white mb-6 uppercase">
          Hero <span className="text-orange-500">Selection</span>
        </h1>

        <div className="w-full max-w-sm relative group skew-x-[-15deg]">
          <input
            type="text"
            placeholder="SEARCH HERO..."
            className="w-full bg-black/60 border border-white/20 px-6 py-2.5 text-white font-black italic tracking-widest focus:outline-none focus:border-orange-500 text-sm placeholder:text-slate-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-3 text-slate-500 group-focus-within:text-orange-500 skew-x-[15deg]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto overflow-x-hidden px-12 py-8 transition-all duration-500 z-10 scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-transparent ${selectedHero ? 'pb-[38vh]' : 'pb-10'}`}>
        <div className="max-w-[1600px] mx-auto w-full">
          {groupedHeroes.tank.length > 0 && (
            <RoleSection title="Tank" role="tank" heroesList={groupedHeroes.tank} colorClass="bg-blue-500" />
          )}
          {groupedHeroes.damage.length > 0 && (
            <RoleSection title="Damage" role="damage" heroesList={groupedHeroes.damage} colorClass="bg-red-500" />
          )}
          {groupedHeroes.support.length > 0 && (
            <RoleSection title="Support" role="support" heroesList={groupedHeroes.support} colorClass="bg-green-500" />
          )}
        </div>
      </main>

      <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 transform ${
        selectedHero ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="h-[33vh] bg-slate-900/95 backdrop-blur-2xl border-t-4 border-orange-500 shadow-[0_-20px_80px_rgba(0,0,0,0.8)] relative flex items-center">
          <button 
            onClick={() => setSelectedHero(null)}
            className="absolute top-6 right-8 text-white/50 hover:text-orange-500 transition-colors z-10"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="max-w-[1600px] mx-auto w-full h-full flex items-center px-12 gap-16">
            <div className="h-full flex items-end shrink-0 relative">
              <img 
                src={selectedHero?.portrait} 
                alt={selectedHero?.name} 
                className="h-[110%] object-contain drop-shadow-[0_0_40px_rgba(249,158,26,0.4)] transform translate-y-0 z-20" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent blur-3xl rounded-full"></div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
              <p className="text-blue-400 font-black tracking-[0.4em] uppercase text-xs mb-3">Target Identity Confirmed</p>
              <div className="flex items-baseline gap-5 mb-3">
                <h3 className="text-6xl font-black italic uppercase text-white tracking-tighter leading-none drop-shadow-2xl">
                  {selectedHero && (heroNameMap[selectedHero.key] || selectedHero.name)}
                </h3>
                <span className="text-2xl font-bold italic uppercase text-slate-500 tracking-widest opacity-80">
                  {selectedHero?.name}
                </span>
              </div>
              <div className="flex gap-4">
                <div className="px-5 py-1.5 bg-slate-800 border-l-4 border-blue-500 font-black italic uppercase tracking-widest text-xs text-blue-300">
                  역할: {selectedHero ? roleMap[selectedHero.role] : ''}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-6 shrink-0 bg-black/30 p-8 rounded-2xl border border-white/5">
              <p className="text-orange-500 font-black italic tracking-[0.5em] text-sm uppercase mb-2">Priority Counter Tactics</p>
              <div className="flex gap-10">
                {counters.map((counter, idx) => (
                  <div key={counter.key} className="relative group/counter flex flex-col items-center transition-all duration-75 hover:scale-105">
                    <div className="w-28 h-28 skew-x-[-10deg] border-2 border-white/10 bg-black overflow-hidden group-hover/counter:border-orange-500 transition-all duration-100 shadow-2xl">
                      <img 
                        src={counter.portrait} 
                        alt={counter.name} 
                        className="w-full h-full object-cover object-top scale-[1.15] skew-x-[10deg] group-hover/counter:scale-[1.25] transition-transform duration-500" 
                      />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-lg font-black border-4 border-slate-900 text-white shadow-lg">
                      {idx + 1}
                    </div>
                    <p className="mt-4 text-sm font-black italic text-slate-400 uppercase tracking-widest group-hover/counter:text-white transition-colors">
                      {heroNameMap[counter.key] || counter.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
