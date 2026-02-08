
import React, { useState } from 'react';
import { BoardGame } from '../types';
import BoardGameCard from './BoardGameCard';
import GameCarousel from './GameCarousel';

interface BoardGameListProps {
  boardGames: BoardGame[];
  selectedCount: number;
  onToggleSelect: (id: number) => void;
  onConfirm: () => void;
}

const CATEGORIES = [
  'ทั้งหมด',
  'ยอดนิยม',
  'เกมวางกลยุทธ์',
  'เกมปาร์ตี้',
  'เกมสวมบทบาท',
  'เกมแนวเศรษฐศาสตร์',
  'เกมปริศนา',
];

const BoardGameList: React.FC<BoardGameListProps> = ({ boardGames, selectedCount, onToggleSelect, onConfirm }) => {
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');

  const popularGames = boardGames.filter(game => game.isPopular);

  const filteredGames = boardGames.filter(game => {
    if (activeCategory === 'ทั้งหมด') return true;
    if (activeCategory === 'ยอดนิยม') return game.isPopular;
    return game.category === activeCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 animate-slide-up">
      {/* Highlight Section (Carousel) */}
      {activeCategory === 'ทั้งหมด' && popularGames.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">บอร์ดเกมแนะนำ</h2>
          </div>
          <GameCarousel popularGames={popularGames} onToggleSelect={onToggleSelect} />
        </section>
      )}

      {/* Filter Section */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">ค้นหาบอร์ดเกม</h2>
            <p className="text-slate-500 mt-1">เลือกหมวดหมู่ที่ท่านสนใจ ({filteredGames.length} รายการ)</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border shadow-sm ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200 scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-500'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32">
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <BoardGameCard
                key={game.id}
                game={game}
                onToggleSelect={onToggleSelect}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-xl font-medium">ไม่พบข้อมูลบอร์ดเกมในหมวดหมู่นี้</p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Selection Bar */}
      {selectedCount > 0 && (
        <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl z-50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between px-8 animate-scale-in">
          <div className="flex flex-col">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Selected Games</span>
            <span className="text-white font-black text-lg">{selectedCount} รายการ</span>
          </div>
          <button
            onClick={onConfirm}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <span>ยืนยันรายการ</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </footer>
      )}
    </div>
  );
};

export default BoardGameList;
