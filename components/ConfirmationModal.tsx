
import React from 'react';
import { BoardGame } from '../types';

interface ConfirmationModalProps {
  selectedGames: BoardGame[];
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ selectedGames, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">ยืนยันรายการบอร์ดเกม</h2>
          <p className="text-gray-500 mt-1">คุณกำลังจะยืมบอร์ดเกม {selectedGames.length} รายการ</p>
        </div>
        
        <div className="p-6 max-h-64 overflow-y-auto">
          <ul className="space-y-3">
            {selectedGames.map(game => (
              <li key={game.id} className="flex items-center bg-gray-50 p-3 rounded-md">
                <img src={game.imageUrl} alt={game.name} className="w-12 h-12 object-cover rounded-md mr-4" />
                <span className="font-semibold text-gray-700">{game.name}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-gray-50 rounded-b-xl flex justify-end items-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-gray-600 font-semibold bg-gray-200 hover:bg-gray-300 transition duration-300"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 transition duration-300"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
