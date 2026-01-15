
import React, { useState, useEffect, useCallback } from 'react';
import { BoardGame } from '../types';

interface GameCarouselProps {
  popularGames: BoardGame[];
  onToggleSelect: (id: number) => void;
}

const GameCarousel: React.FC<GameCarouselProps> = ({ popularGames, onToggleSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % popularGames.length);
  }, [popularGames.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + popularGames.length) % popularGames.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000); // เลื่อนอัตโนมัติทุก 5 วินาที
    return () => clearInterval(interval);
  }, [nextSlide]);

  if (popularGames.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl mb-10 shadow-2xl bg-slate-800">
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-[300px] md:h-[400px]"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {popularGames.map((game) => (
          <div key={game.id} className="min-w-full relative h-full group">
            <img 
              src={game.imageUrl} 
              alt={game.name} 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full text-white">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  HOT ITEM
                </span>
                <span className="text-sm font-medium text-slate-300">| {game.category}</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-3 drop-shadow-lg">{game.name}</h2>
              <p className="text-slate-200 text-sm md:text-lg mb-6 max-w-2xl line-clamp-2 drop-shadow-md">
                {game.description}
              </p>
              <button 
                onClick={() => onToggleSelect(game.id)}
                className={`px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 ${
                  game.selected 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {game.selected ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    เลือกแล้ว
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                    เลือกเกมนี้
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors z-10 hidden md:block"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors z-10 hidden md:block"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 right-6 flex gap-2">
        {popularGames.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`transition-all duration-300 rounded-full h-2 ${
              currentIndex === i ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default GameCarousel;
