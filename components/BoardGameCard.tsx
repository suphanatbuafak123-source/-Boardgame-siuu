
import React from 'react';
import { BoardGame } from '../types';

interface BoardGameCardProps {
  game: BoardGame;
  onToggleSelect: (id: number) => void;
}

const BoardGameCard: React.FC<BoardGameCardProps> = ({ game, onToggleSelect }) => {
  const { id, name, description, imageUrl, selected, category, isPopular } = game;

  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 cursor-pointer border-4 ${selected ? 'border-blue-500' : 'border-transparent'}`}
      onClick={() => onToggleSelect(id)}
    >
      {/* Badges Container - Top Right */}
      <div className="absolute top-2 right-2 flex flex-col items-end space-y-1 z-10">
        {isPopular && (
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.422-.865c-.215.082-.456.23-.722.466-.464.41-.887.95-1.2 1.62-.647 1.383-.604 3.018.39 4.757.292.51.65 1.05 1.056 1.558A5.992 5.992 0 007 18h10a5.99 5.99 0 004.978-4.148 1 1 0 00-.503-1.127 8.01 8.01 0 01-1.622-1.396 7.95 7.95 0 01-1.353-2.023c-.76-1.554-.844-3.551-.976-5.07a33.58 33.58 0 00-.57-4.226.999.999 0 00-.56-.637z" clipRule="evenodd" />
            </svg>
            ยอดนิยม
          </span>
        )}
        {category && (
          <span className="bg-gray-900 bg-opacity-70 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
            {category}
          </span>
        )}
      </div>

      <img className="w-full h-48 object-cover" src={imageUrl} alt={name} />
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2 truncate" title={name}>{name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`checkbox-${id}`}
            checked={selected}
            onChange={() => onToggleSelect(id)}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 pointer-events-none"
          />
          <label htmlFor={`checkbox-${id}`} className="ml-2 text-gray-700 font-medium pointer-events-none">
            {selected ? 'เลือกแล้ว' : 'เลือก'}
          </label>
        </div>
      </div>
    </div>
  );
};

export default BoardGameCard;
