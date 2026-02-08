
import React from 'react';
import { BoardGame } from '../types';

interface BoardGameCardProps {
  game: BoardGame;
  onToggleSelect: (id: number) => void;
  theme?: any;
}

const BoardGameCard: React.FC<BoardGameCardProps> = ({ game, onToggleSelect, theme }) => {
  const { id, name, description, imageUrl, selected, category, isPopular } = game;
  const primaryColor = theme?.primary || 'blue';

  return (
    <div
      className={`group relative bg-white/80 backdrop-blur-sm rounded-[35px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] overflow-hidden transform transition-all duration-500 hover:-translate-y-4 hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] cursor-pointer border-4 ${selected ? `border-${primaryColor}-500 scale-[1.02] shadow-${primaryColor}-500/20` : 'border-transparent hover:border-white/50'}`}
      onClick={() => onToggleSelect(id)}
    >
      {/* Selection Glow */}
      {selected && (
        <div className={`absolute inset-0 bg-${primaryColor}-500/5 animate-pulse z-0 pointer-events-none`} />
      )}

      {/* Badges - Premium Look */}
      <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 z-20">
        {isPopular && (
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg flex items-center animate-pulse">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            POPULAR
          </span>
        )}
        {category && (
          <span className="bg-slate-900/80 text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-lg backdrop-blur-md border border-white/10 uppercase tracking-tighter">
            {category}
          </span>
        )}
      </div>

      {/* Image with Tilt/Overlay */}
      <div className="relative h-56 overflow-hidden">
        <img 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          src={imageUrl} 
          alt={name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick select indicator */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${selected ? `bg-${primaryColor}-600/20` : 'bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/10'}`}>
           <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${selected ? `bg-${primaryColor}-600 scale-100` : 'bg-white scale-75 group-hover:scale-100'}`}>
              <svg className={`w-8 h-8 ${selected ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={selected ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"}></path></svg>
           </div>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <h3 className={`text-2xl font-black text-slate-800 mb-2 truncate group-hover:text-${primaryColor}-600 transition-colors`} title={name}>{name}</h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed">{description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${selected ? `bg-${primaryColor}-600 text-white rotate-[360deg]` : 'bg-slate-100 text-slate-300'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <span className={`text-sm font-black transition-colors ${selected ? `text-${primaryColor}-600` : 'text-slate-400'}`}>
              {selected ? 'SELECTED' : 'SELECT GAME'}
            </span>
          </div>
          <div className="text-[10px] font-bold text-slate-300 group-hover:text-slate-400 transition-colors">#{id.toString().padStart(3, '0')}</div>
        </div>
      </div>
    </div>
  );
};

export default BoardGameCard;
