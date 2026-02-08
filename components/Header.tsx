
import React from 'react';

interface HeaderProps {
  onReturnClick: () => void;
  onManageClick: () => void;
  onSearchClick: () => void;
  onHistoryClick: () => void;
  season?: string;
  theme: any;
}

const Header: React.FC<HeaderProps> = ({ onReturnClick, onManageClick, onSearchClick, onHistoryClick, season, theme }) => {
  const getSeasonStyle = () => {
    switch (season) {
      case 'summer': return 'border-orange-100/50 bg-white/60 shadow-[0_8px_32px_0_rgba(251,146,60,0.1)]';
      case 'rainy': return 'border-teal-100/50 bg-white/60 shadow-[0_8px_32px_0_rgba(20,184,166,0.1)]';
      case 'winter': return 'border-blue-100/50 bg-white/60 shadow-[0_8px_32px_0_rgba(59,130,246,0.1)]';
      default: return 'border-slate-100 bg-white shadow-lg';
    }
  };

  const primaryColorClass = `text-${theme.primary}-600`;
  const primaryBgClass = `bg-${theme.primary}-600`;

  return (
    <header className={`backdrop-blur-xl border-b sticky top-0 z-[100] transition-all duration-1000 ${getSeasonStyle()}`}>
      <div className="container mx-auto px-6 py-4 flex justify-between items-center gap-4">
        {/* Enhanced Logo */}
        <div className="flex items-center overflow-hidden cursor-pointer group" onClick={() => window.location.reload()}>
          <div className={`w-12 h-12 ${primaryBgClass} rounded-[18px] flex items-center justify-center mr-4 group-hover:rotate-[15deg] transition-all duration-500 shadow-xl shadow-${theme.primary}-500/40 transform group-hover:scale-110`}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 leading-none">ยืมคืน <span className={primaryColorClass}>{season === 'summer' ? 'บอร์ดเกม' : season === 'rainy' ? 'บอร์ดเกม' : 'บอร์ดเกม'}</span></h1>
            <span className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Wanich Library</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden md:flex items-center gap-2 pr-4 border-r border-slate-200">
             <button onClick={onSearchClick} className={`w-10 h-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-white hover:${primaryColorClass} hover:shadow-md transition-all`}>
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             </button>
             <button onClick={onHistoryClick} className={`w-10 h-10 flex items-center justify-center rounded-2xl text-slate-500 hover:bg-white hover:${primaryColorClass} hover:shadow-md transition-all`}>
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             </button>
          </div>

          <button
            onClick={onReturnClick}
            className="bg-green-600 text-white font-black py-3 px-6 rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/20 flex items-center gap-3 transform active:scale-95 group"
          >
            <div className="bg-white/20 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2z"></path></svg>
            </div>
            <span className="hidden sm:inline">แจ้งคืนบอร์ดเกม</span>
            <span className="sm:hidden">คืนเกม</span>
          </button>

          <button
            onClick={onManageClick}
            className="w-12 h-12 bg-slate-800 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-lg flex items-center justify-center group transform hover:rotate-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
