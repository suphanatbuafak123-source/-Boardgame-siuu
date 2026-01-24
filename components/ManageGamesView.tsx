
import React, { useState } from 'react';
import { BoardGame } from '../types';

interface ManageGamesViewProps {
  boardGames: BoardGame[];
  onAddGame: (newGame: any) => void;
  onUpdateGame: (game: BoardGame) => void;
  onDeleteGames: (ids: number[]) => void;
  onResetData: () => void;
  onBack: () => void;
}

const CATEGORIES = ['เกมวางกลยุทธ์', 'เกมปาร์ตี้', 'เกมสวมบทบาท', 'เกมแนวเศรษฐศาสตร์', 'เกมปริศนา'];

const ManageGamesView: React.FC<ManageGamesViewProps> = ({ boardGames, onAddGame, onUpdateGame, onDeleteGames, onResetData, onBack }) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState(''); // New barcode state
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPopular, setIsPopular] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleEditClick = () => {
    if (selectedIds.length !== 1) return;
    const game = boardGames.find(g => g.id === selectedIds[0]);
    if (game) {
      setName(game.name);
      setBarcode(game.barcode || '');
      setDescription(game.description);
      setImageUrl(game.imageUrl);
      setCategory(game.category || CATEGORIES[0]);
      setIsPopular(game.isPopular || false);
      setEditingId(game.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !imageUrl) {
      setError('กรุณากรอกข้อมูลสำคัญให้ครบ');
      return;
    }
    
    const gameData = { name, barcode, description, imageUrl, category, isPopular };

    if (editingId) {
      const originalGame = boardGames.find(g => g.id === editingId);
      if (originalGame) {
        onUpdateGame({ ...originalGame, ...gameData });
        handleCancelEdit();
      }
    } else {
      onAddGame(gameData);
      handleCancelEdit();
    }
  };

  const handleCancelEdit = () => {
    setName('');
    setBarcode('');
    setDescription('');
    setImageUrl('');
    setEditingId(null);
    setSelectedIds([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="text-blue-600 hover:underline mb-6 inline-block">&larr; กลับไปหน้าหลัก</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-lg h-fit sticky top-4">
          <h2 className="text-2xl font-bold mb-4">{editingId ? 'แก้ไขบอร์ดเกม' : 'เพิ่มบอร์ดเกมใหม่'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">ชื่อบอร์ดเกม</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 text-blue-600">รหัสสแกน (Barcode ตัวเลข)</label>
              <input 
                type="text" 
                value={barcode} 
                onChange={e => setBarcode(e.target.value)} 
                className="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none" 
                placeholder="เช่น 001"
              />
              <p className="text-[10px] text-slate-400 mt-1">* ใช้สแกนแทนชื่อภาษาไทยได้</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">หมวดหมู่</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">URL รูปภาพ</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">คำอธิบาย</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded-lg" rows={2} required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pop" checked={isPopular} onChange={e => setIsPopular(e.target.checked)} />
              <label htmlFor="pop" className="text-sm">ยอดนิยม</label>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition">
              {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเกม'}
            </button>
            {editingId && <button type="button" onClick={handleCancelEdit} className="w-full text-slate-400 text-sm">ยกเลิก</button>}
          </form>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">รายการทั้งหมด</h2>
            <button onClick={onResetData} className="text-xs text-red-500">Reset</button>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {boardGames.slice().reverse().map(game => (
              <div key={game.id} className={`flex items-center gap-3 p-3 bg-slate-50 rounded-xl border-2 ${selectedIds.includes(game.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}>
                <input type="checkbox" checked={selectedIds.includes(game.id)} onChange={() => setSelectedIds(prev => prev.includes(game.id) ? prev.filter(i => i !== game.id) : [...prev, game.id])} />
                <img src={game.imageUrl} className="w-10 h-10 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{game.name}</p>
                  <p className="text-[10px] text-blue-600 font-mono">ID: {game.barcode || '-'}</p>
                </div>
              </div>
            ))}
          </div>
          {selectedIds.length > 0 && (
            <div className="flex gap-2 mt-4">
              {selectedIds.length === 1 && <button onClick={handleEditClick} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-bold">แก้ไข</button>}
              <button onClick={() => {onDeleteGames(selectedIds); setSelectedIds([]);}} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold">ลบ</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageGamesView;
