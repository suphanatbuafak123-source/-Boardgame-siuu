
import React from 'react';

interface HeaderProps {
  onReturnClick: () => void;
  onManageClick: () => void;
  onSearchClick: () => void;
  onHistoryClick: () => void;
  season?: string;
}

const Header: React.FC<HeaderProps> = ({ onReturnClick, onManageClick, onSearchClick, onHistoryClick, season }) => {
  const getSeasonStyle = () => {
    switch (season) {
      case 'summer': return 'border-orange-100 bg-white/70 shadow-orange-100/50';
      case 'rainy': return 'border-teal-100 bg-white/70 shadow-teal-100/50';
      case 'winter': return 'border-blue-100 bg-white/70 shadow-blue-100/50';
      default: return 'border-slate-100 bg-white shadow-md';
    }
  };

  return (
    <header className={`backdrop-blur-md border-b sticky top-0 z-[100] transition-all duration-700 ${getSeasonStyle()}`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
        {/* Logo/Title */}
        <div className="flex items-center overflow-hidden cursor-pointer group" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center mr-3 group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-800 truncate">BOARD GAME <span className="text-blue-600">LENDING</span></h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          {/* Search Trigger */}
          <button 
            onClick={onSearchClick}
            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>

          {/* History Button */}
          <button
            onClick={onHistoryClick}
            className="bg-white/50 text-slate-700 font-bold py-2.5 px-3 md:px-4 rounded-xl hover:bg-white hover:shadow-md transition-all flex items-center shadow-sm border border-slate-200"
          >
            <svg className="w-5 h-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            <span className="hidden md:inline">ประวัติรายการ</span>
          </button>

          {/* Return Button */}
          <button
            onClick={onReturnClick}
            className="bg-green-600 text-white font-black py-2.5 px-4 md:px-6 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-500/30 flex items-center text-sm md:text-base whitespace-nowrap"
          >
            <svg className="w-5 h-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2z"></path></svg>
            คืนบอร์ดเกม
          </button>

          {/* Manage Button */}
          <button
            onClick={onManageClick}
            className="bg-slate-800 text-white p-2.5 rounded-xl hover:bg-slate-900 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
