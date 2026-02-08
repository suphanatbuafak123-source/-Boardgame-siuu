
import React, { useState, useEffect, useRef } from 'react';
import { BoardGame } from '../types';
import BoardGameCard from './BoardGameCard';

interface SearchViewProps {
  boardGames: BoardGame[];
  selectedCount: number;
  onToggleSelect: (id: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const SearchView: React.FC<SearchViewProps> = ({ 
  boardGames, 
  selectedCount, 
  onToggleSelect, 
  onConfirm, 
  onBack 
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const filteredGames = boardGames.filter(game => 
    game.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="animate-slide-up pt-6">
      <div className="max-w-2xl mx-auto mb-12 px-4">
        <button 
          onClick={onBack} 
          className="text-slate-400 hover:text-blue-600 mb-6 flex items-center transition-colors duration-200 font-bold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับไปหน้าหลัก
        </button>
        
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-16 pr-14 py-5 bg-white border border-slate-100 rounded-[30px] shadow-xl focus:shadow-blue-500/10 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-xl font-bold transition-all duration-300"
            placeholder="ค้นหาชื่อบอร์ดเกม..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          {query && (
            <button 
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-red-500 cursor-pointer transition-colors"
            >
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {query && filteredGames.length === 0 ? (
        <div className="text-center py-20 text-slate-300 bg-white rounded-[40px] max-w-2xl mx-auto border border-dashed border-slate-200">
          <svg className="w-20 h-20 mx-auto mb-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-2xl font-black">ไม่พบบอร์ดเกมที่ตรงกับ "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-32">
          {filteredGames.map(game => (
            <BoardGameCard
              key={game.id}
              game={game}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchView;
