
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

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const filteredGames = boardGames.filter(game => 
    game.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="animate-fade-in pt-6">
      <div className="max-w-2xl mx-auto mb-12 px-4">
        <button 
          onClick={onBack} 
          className="text-gray-500 hover:text-blue-600 mb-6 flex items-center transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับไปหน้าหลัก
        </button>
        
        {/* Google Style Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-14 pr-12 py-3.5 bg-white border border-gray-200 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.12)] focus:shadow-[0_4px_10px_rgba(0,0,0,0.12)] placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200 text-lg transition-all duration-300"
            placeholder="ค้นหาบอร์ดเกม"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          
          {/* Clear Button (appears when typing) */}
          {query && (
            <button 
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
        </div>
      </div>

      {query && filteredGames.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-xl">ไม่พบบอร์ดเกมที่ตรงกับ "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-24">
          {filteredGames.map(game => (
            <BoardGameCard
              key={game.id}
              game={game}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}

      {/* Footer for confirmation - same as Main List */}
      {boardGames.length > 0 && selectedCount > 0 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg z-20">
          <div className="container mx-auto flex justify-center items-center">
            <button
              onClick={onConfirm}
              className="w-full max-w-md bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-md transform hover:scale-105"
            >
              ยืนยัน ({selectedCount} รายการ)
            </button>
          </div>
        </footer>
      )}
    </div>
  );
};

export default SearchView;
