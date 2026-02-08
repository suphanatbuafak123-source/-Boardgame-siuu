
import React from 'react';
import { BoardGame } from '../types';

interface ConfirmationModalProps {
  selectedGames: BoardGame[];
  onClose: () => void;
  onConfirm: () => void;
  // Added theme prop to fix TypeScript error
  theme?: any;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ selectedGames, onClose, onConfirm, theme }) => {
  const primaryColor = theme?.primary || 'blue';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex justify-center items-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="p-8 border-b border-gray-100 bg-slate-50">
          <h2 className="text-2xl font-black text-slate-800">ยืนยันรายการบอร์ดเกม</h2>
          <p className="text-slate-500 mt-1 font-bold">คุณกำลังจะยืมบอร์ดเกม {selectedGames.length} รายการ</p>
        </div>
        
        <div className="p-8 max-h-64 overflow-y-auto">
          <ul className="space-y-3">
            {selectedGames.map(game => (
              <li key={game.id} className="flex items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <img src={game.imageUrl} alt={game.name} className="w-12 h-12 object-cover rounded-xl mr-4 shadow-sm" />
                <span className="font-black text-slate-700">{game.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-8 bg-white flex justify-end items-center space-x-4">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-2xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition duration-300"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className={`px-8 py-3 rounded-2xl text-white font-black bg-${primaryColor}-600 hover:bg-${primaryColor}-700 shadow-lg shadow-${primaryColor}-500/20 transition duration-300 transform active:scale-95`}
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
