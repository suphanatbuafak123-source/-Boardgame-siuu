
import React, { useMemo } from 'react';

export type Season = 'summer' | 'rainy' | 'winter';

interface SeasonalEffectProps {
  season: Season;
}

const SeasonalEffect: React.FC<SeasonalEffectProps> = ({ season }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      opacity: 0.1 + Math.random() * 0.5,
      size: 2 + Math.random() * 4,
    }));
  }, [season]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {/* BACKGROUND ELEMENTS */}
      {season === 'winter' && (
        <>
          {/* Snowy Mountains */}
          <div className="absolute bottom-0 left-0 w-full h-64 bg-white/40 skew-y-[-5deg] origin-left blur-xl" />
          <div className="absolute bottom-[-50px] right-0 w-full h-80 bg-white/30 skew-y-[8deg] origin-right blur-2xl" />
          
          {/* Snow Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-white rounded-full animate-snow"
              style={{
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animationDelay: p.delay,
                animationDuration: p.duration,
                top: '-20px',
              }}
            />
          ))}

          {/* THE SLED (Inspired by video) */}
          <div className="absolute top-[20%] left-[-200px] animate-sled-slide flex items-end">
             <div className="relative flex items-center justify-center bg-amber-800 h-8 w-24 rounded-b-xl border-b-4 border-amber-900 shadow-lg">
                <span className="text-2xl absolute bottom-4 left-2">🐻</span>
                <span className="text-2xl absolute bottom-5 left-8">🐸</span>
                <span className="text-2xl absolute bottom-4 left-14">🐱</span>
                {/* Sled Runners */}
                <div className="absolute bottom-[-4px] left-[-10px] w-32 h-1 bg-slate-300 rounded-full" />
             </div>
             {/* Snow trail effect */}
             <div className="w-16 h-4 bg-white/40 blur-sm rounded-full animate-pulse ml-[-20px]" />
          </div>
        </>
      )}

      {season === 'summer' && (
        <>
          {/* Sun & Rays */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-orange-400 rounded-full blur-[60px] animate-pulse" />
          
          {/* Ocean Waves at bottom */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-blue-400/20 blur-xl animate-wave" />
          
          {/* Surfer Character */}
          <div className="absolute bottom-20 left-[-150px] animate-surfer text-4xl">
            🏄‍♂️🐱
          </div>

          {/* Floating Sunshine */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-yellow-200/20 rounded-full blur-lg animate-float"
              style={{
                left: p.left,
                width: `${p.size * 15}px`,
                height: `${p.size * 15}px`,
                opacity: p.opacity * 0.4,
                animationDelay: p.delay,
                animationDuration: `${15 + Math.random() * 10}s`,
                top: `${Math.random() * 80}%`,
              }}
            />
          ))}
        </>
      )}

      {season === 'rainy' && (
        <>
          {/* Rain Drops */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-blue-300/40 animate-rain"
              style={{
                left: p.left,
                width: '1px',
                height: `${20 + Math.random() * 30}px`,
                opacity: p.opacity,
                animationDelay: p.delay,
                animationDuration: `${0.4 + Math.random() * 0.4}s`,
                top: '-100px',
              }}
            />
          ))}

          {/* Hopping Frog */}
          <div className="absolute bottom-10 left-[-100px] animate-frog-jump text-4xl">
            🐸
          </div>

          {/* Puddles */}
          <div className="absolute bottom-4 left-1/4 w-32 h-4 bg-blue-200/30 rounded-full blur-md animate-pulse" />
          <div className="absolute bottom-8 right-1/3 w-48 h-6 bg-blue-200/20 rounded-full blur-lg animate-pulse" />
        </>
      )}

      <style>{`
        @keyframes snow {
          0% { transform: translateY(0) translateX(0) rotate(0); }
          50% { transform: translateY(50vh) translateX(30px) rotate(180deg); }
          100% { transform: translateY(105vh) translateX(-20px) rotate(360deg); }
        }
        @keyframes rain {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(110vh) translateX(15px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-40px) translateX(40px); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(-5%); }
          50% { transform: translateX(5%); }
        }
        
        /* Winter Sled Slide Animation */
        @keyframes sled-slide {
          0% { transform: translate(-100px, -50px) rotate(10deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(120vw, 60vh) rotate(15deg); opacity: 0; }
        }
        .animate-sled-slide { 
          animation: sled-slide 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 2s;
        }

        /* Summer Surfer Animation */
        @keyframes surfer {
          0% { transform: translateX(-100px) translateY(0) rotate(-5deg); }
          25% { transform: translateX(25vw) translateY(-20px) rotate(5deg); }
          50% { transform: translateX(50vw) translateY(10px) rotate(-5deg); }
          75% { transform: translateX(75vw) translateY(-15px) rotate(5deg); }
          100% { transform: translateX(110vw) translateY(0) rotate(-5deg); }
        }
        .animate-surfer {
          animation: surfer 12s linear infinite;
        }

        /* Rainy Frog Jump Animation */
        @keyframes frog-jump {
          0% { transform: translateX(-50px) translateY(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(var(--jump-x)) translateY(-40px); }
          20%, 40%, 60%, 80%, 100% { transform: translateX(var(--jump-x)) translateY(0); }
        }
        /* Simplify frog jump for CSS only */
        @keyframes frog-jump-simple {
          0% { left: -50px; bottom: 40px; }
          10% { left: 10vw; bottom: 80px; }
          20% { left: 20vw; bottom: 40px; }
          30% { left: 30vw; bottom: 80px; }
          40% { left: 40vw; bottom: 40px; }
          50% { left: 50vw; bottom: 80px; }
          60% { left: 60vw; bottom: 40px; }
          70% { left: 70vw; bottom: 80px; }
          80% { left: 80vw; bottom: 40px; }
          90% { left: 90vw; bottom: 80px; }
          100% { left: 110vw; bottom: 40px; }
        }
        .animate-frog-jump {
          animation: frog-jump-simple 10s linear infinite;
        }

        .animate-snow { animation: snow linear infinite; }
        .animate-rain { animation: rain linear infinite; }
        .animate-float { animation: float ease-in-out infinite; }
        .animate-wave { animation: wave 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SeasonalEffect;
