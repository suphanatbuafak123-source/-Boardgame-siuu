
import React, { useMemo } from 'react';

export type Season = 'summer' | 'rainy' | 'winter';

interface SeasonalEffectProps {
  season: Season;
}

const SeasonalEffect: React.FC<SeasonalEffectProps> = ({ season }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
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
      {season === 'winter' && (
        <div className="absolute inset-0">
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
        </div>
      )}

      {season === 'rainy' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-blue-400/40 animate-rain"
              style={{
                left: p.left,
                width: '1px',
                height: `${15 + Math.random() * 20}px`,
                opacity: p.opacity,
                animationDelay: p.delay,
                animationDuration: `${0.5 + Math.random() * 1}s`,
                top: '-100px',
              }}
            />
          ))}
        </div>
      )}

      {season === 'summer' && (
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute bg-yellow-200/30 rounded-full blur-xl animate-float"
              style={{
                left: p.left,
                width: `${p.size * 20}px`,
                height: `${p.size * 20}px`,
                opacity: p.opacity * 0.3,
                animationDelay: p.delay,
                animationDuration: `${10 + Math.random() * 10}s`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
          <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-orange-400/20 rounded-full blur-[100px] animate-pulse" />
        </div>
      )}

      <style>{`
        @keyframes snow {
          0% { transform: translateY(0) translateX(0) rotate(0); }
          50% { transform: translateY(50vh) translateX(20px) rotate(180deg); }
          100% { transform: translateY(105vh) translateX(-20px) rotate(360deg); }
        }
        @keyframes rain {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(110vh) translateX(10px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-50px) translateX(30px); }
        }
        .animate-snow { animation: snow linear infinite; }
        .animate-rain { animation: rain linear infinite; }
        .animate-float { animation: float ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SeasonalEffect;
