
import React, { useState, useRef } from 'react';
import { BoardGame } from '../types';

interface ManageGamesViewProps {
  boardGames: BoardGame[];
  onAddGame: (newGame: any) => void;
  onUpdateGame: (game: BoardGame) => void;
  onDeleteGames: (ids: number[]) => void;
  onResetData: () => void;
  onBack: () => void;
  // Added theme prop to fix TypeScript error
  theme?: any;
}

const CATEGORIES = ['เกมวางกลยุทธ์', 'เกมปาร์ตี้', 'เกมสวมบทบาท', 'เกมแนวเศรษฐศาสตร์', 'เกมปริศนา'];

const ManageGamesView: React.FC<ManageGamesViewProps> = ({ boardGames, onAddGame, onUpdateGame, onDeleteGames, onResetData, onBack, theme }) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPopular, setIsPopular] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryColor = theme?.primary || 'blue';

  const handleExportData = () => {
    const dataStr = JSON.stringify(boardGames, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `board_games_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        alert("ไฟล์มีขนาดใหญ่เกินไป (จำกัด 1MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      setError('กรุณากรอกข้อมูลสำคัญและเลือกรูปภาพ');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <button onClick={onBack} className={`text-slate-400 font-bold hover:text-${primaryColor}-600 mb-6 inline-flex items-center transition-colors`}>
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        กลับไปหน้าหลัก
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ฟอร์มเพิ่ม/แก้ไข */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl h-fit sticky top-4 border border-slate-100">
          <h2 className="text-2xl font-black mb-6 text-slate-800">{editingId ? 'แก้ไขบอร์ดเกม' : 'เพิ่มบอร์ดเกมใหม่'}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            
            <div>
              <label className="block text-sm font-bold mb-1 text-slate-600">ชื่อบอร์ดเกม</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-${primaryColor}-500 outline-none transition-all`} placeholder="ชื่อเกม" required />
            </div>

            <div>
              <label className={`block text-sm font-bold mb-1 text-${primaryColor}-600`}>รหัสสแกน (Barcode)</label>
              <input type="text" value={barcode} onChange={e => setBarcode(e.target.value)} className={`w-full px-4 py-2 border-2 border-${primaryColor}-100 rounded-xl focus:border-${primaryColor}-500 outline-none transition-all`} placeholder="เช่น 001" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-slate-600">รูปภาพบอร์ดเกม</label>
              <div className="space-y-3">
                {imageUrl && (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload" 
                    className="flex-1 cursor-pointer bg-slate-100 text-slate-700 py-2 px-4 rounded-xl text-center font-bold text-sm hover:bg-slate-200 transition-all border-2 border-dashed border-slate-300"
                  >
                    {imageUrl ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปจากเครื่อง'}
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-slate-600">หมวดหมู่</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={`w-full px-4 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-${primaryColor}-500`}>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1 text-slate-600">คำอธิบายสั้นๆ</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className={`w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-${primaryColor}-500`} rows={2} placeholder="รายละเอียดเกม..." required />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input type="checkbox" id="pop" checked={isPopular} onChange={e => setIsPopular(e.target.checked)} className={`w-5 h-5 rounded border-gray-300 text-${primaryColor}-600 focus:ring-${primaryColor}-500`} />
              <label htmlFor="pop" className="text-sm font-bold text-slate-700">แสดงในรายการแนะนำ (ยอดนิยม)</label>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className={`flex-1 bg-${primaryColor}-600 text-white font-black py-4 rounded-2xl hover:bg-${primaryColor}-700 transition shadow-lg shadow-${primaryColor}-500/30`}>
                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเกมใหม่'}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancelEdit} className="px-6 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition">
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* รายชื่อเกมที่มีอยู่ */}
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800">รายการบอร์ดเกมทั้งหมด</h2>
            <div className="flex gap-3">
              <button 
                onClick={handleExportData}
                title="ดาวน์โหลดข้อมูลเป็นไฟล์ JSON"
                className="flex items-center gap-1 text-[10px] font-black text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded-lg transition-colors border border-green-100"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                EXPORT
              </button>
              <button onClick={onResetData} className="text-[10px] font-black text-red-400 hover:text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-100">RESET ALL</button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {boardGames.slice().reverse().map(game => (
              <div 
                key={game.id} 
                onClick={() => setSelectedIds(prev => prev.includes(game.id) ? prev.filter(i => i !== game.id) : [...prev, game.id])}
                className={`flex items-center gap-4 p-3 rounded-2xl border-2 transition-all cursor-pointer group ${selectedIds.includes(game.id) ? `border-${primaryColor}-500 bg-${primaryColor}-50` : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.includes(game.id) ? `bg-${primaryColor}-500 border-${primaryColor}-500 text-white` : 'bg-white border-slate-200'}`}>
                  {selectedIds.includes(game.id) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                </div>
                <img src={game.imageUrl} className="w-12 h-12 object-cover rounded-xl shadow-sm" alt={game.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate">{game.name}</p>
                  <div className="flex gap-2 items-center">
                    <span className={`text-[10px] font-bold text-${primaryColor}-600 bg-${primaryColor}-100 px-2 py-0.5 rounded-full`}>ID: {game.barcode || '-'}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{game.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex gap-3 mt-6 animate-scale-in">
              {selectedIds.length === 1 && (
                <button onClick={handleEditClick} className="flex-1 bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition transform active:scale-95">
                  แก้ไขข้อมูล
                </button>
              )}
              <button onClick={() => {if(confirm('ต้องการลบเกมที่เลือก?')) { onDeleteGames(selectedIds); setSelectedIds([]); }}} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition transform active:scale-95">
                ลบ ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ManageGamesView;
