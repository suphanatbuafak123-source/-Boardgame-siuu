
import React, { useState } from 'react';
import { BoardGame } from '../types';

interface ManageGamesViewProps {
  boardGames: BoardGame[];
  onAddGame: (newGame: { name: string; description: string; imageUrl: string; category: string; isPopular: boolean }) => void;
  onUpdateGame: (game: BoardGame) => void;
  onDeleteGames: (ids: number[]) => void;
  onResetData: () => void;
  onBack: () => void;
}

const CATEGORIES = [
  'เกมวางกลยุทธ์',
  'เกมปาร์ตี้',
  'เกมสวมบทบาท',
  'เกมแนวเศรษฐศาสตร์',
  'เกมปริศนา',
];

// Helper to resize and convert image to Base64
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Limit width to 800px to save space
        
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
       
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
            reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const ManageGamesView: React.FC<ManageGamesViewProps> = ({ boardGames, onAddGame, onUpdateGame, onDeleteGames, onResetData, onBack }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isPopular, setIsPopular] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for image source type
  const [imageSource, setImageSource] = useState<'url' | 'upload'>('url');
  
  // State for selection and editing
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleEditClick = () => {
    if (selectedIds.length !== 1) return;
    const game = boardGames.find(g => g.id === selectedIds[0]);
    if (game) {
      setName(game.name);
      setDescription(game.description);
      setImageUrl(game.imageUrl);
      setCategory(game.category || CATEGORIES[0]);
      setIsPopular(game.isPopular || false);
      setEditingId(game.id);
      
      // Determine image source based on content
      if (game.imageUrl.startsWith('data:')) {
        setImageSource('upload');
      } else {
        setImageSource('url');
      }
      
      setError(null);
      // Scroll to top for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`คุณต้องการลบบอร์ดเกมที่เลือก ${selectedIds.length} รายการใช่หรือไม่?`)) {
      onDeleteGames(selectedIds);
      setSelectedIds([]);
      if (editingId && selectedIds.includes(editingId)) {
        handleCancelEdit();
      }
    }
  };

  const handleCancelEdit = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setCategory(CATEGORIES[0]);
    setIsPopular(false);
    setImageSource('url');
    setEditingId(null);
    setError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await resizeImage(e.target.files[0]);
        setImageUrl(base64);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !imageUrl || !category) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง และเลือกรูปภาพ');
      return;
    }
    setError(null);
    
    if (editingId) {
      const originalGame = boardGames.find(g => g.id === editingId);
      if (originalGame) {
        onUpdateGame({
          ...originalGame,
          name,
          description,
          imageUrl,
          category,
          isPopular,
        });
        alert('แก้ไขบอร์ดเกมเรียบร้อย');
        handleCancelEdit();
        setSelectedIds([]);
      }
    } else {
      onAddGame({ name, description, imageUrl, category, isPopular });
      // Reset form
      setName('');
      setDescription('');
      setImageUrl('');
      setCategory(CATEGORIES[0]);
      setIsPopular(false);
      setImageSource('url');
    }
  };

  const handleExportData = () => {
    // Reset selection state for the export file so all start as unselected
    const gamesForExport = boardGames.map(game => ({
      ...game,
      selected: false
    }));

    const fileContent = `import { BoardGame } from '../types';

export const INITIAL_BOARD_GAMES: BoardGame[] = ${JSON.stringify(gamesForExport, null, 2)};`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'boardGames.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('ดาวน์โหลดไฟล์ boardGames.ts แล้ว!\n\nให้นำไฟล์นี้ไปวางทับไฟล์เดิมที่ "data/boardGames.ts" ในโปรเจกต์ เพื่อให้ข้อมูลชุดนี้เป็นข้อมูลเริ่มต้นถาวร');
  };

  // Determine UI state
  const canEdit = selectedIds.length === 1;
  const canDelete = selectedIds.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
       <button onClick={onBack} className="text-blue-600 hover:underline mb-6 inline-block">&larr; กลับไปหน้าหลัก</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg h-fit sticky top-4">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            {editingId ? 'แก้ไขบอร์ดเกม' : 'เพิ่มบอร์ดเกมใหม่'}
          </h2>
          <p className="text-gray-500 mb-6">
            {editingId ? 'แก้ไขรายละเอียดของเกม' : 'กรอกรายละเอียดเพื่อเพิ่มเกมในระบบ'}
          </p>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-gray-700 mb-1">ชื่อบอร์ดเกม</label>
              <input
                type="text"
                id="gameName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="เช่น Suphanat112"
                required
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPopular"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="isPopular" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                เป็นเกมยอดนิยม (แสดงในหมวด "ยอดนิยม")
              </label>
            </div>

            <div>
              <label htmlFor="gameDescription" className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
              <textarea
                id="gameDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="อธิบายเกี่ยวกับเกมสั้นๆ"
                required
              />
            </div>

            {/* Image Selection Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพ</label>
              
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="imageSource" 
                    checked={imageSource === 'url'} 
                    onChange={() => setImageSource('url')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">ใช้ URL</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="radio" 
                    name="imageSource" 
                    checked={imageSource === 'upload'} 
                    onChange={() => setImageSource('upload')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">อัปโหลดจากเครื่อง</span>
                </label>
              </div>

              {imageSource === 'url' ? (
                <input
                  type="url"
                  value={!imageUrl.startsWith('data:') ? imageUrl : ''}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              ) : (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>เลือกไฟล์รูปภาพ</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF</p>
                  </div>
                </div>
              )}
              
              {/* Image Preview */}
              {imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">ตัวอย่างรูปภาพ:</p>
                  <div className="relative h-32 w-full border border-gray-200 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                    <img src={imageUrl} alt="Preview" className="h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                className={`flex-1 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 ${editingId ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
              >
                {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มบอร์ดเกม'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800">รายการทั้งหมด</h2>
            <div className="flex space-x-2">
              <button
                onClick={onResetData}
                className="flex items-center text-sm bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded border border-red-200 transition-colors"
                title="รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้น"
              >
                 <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                รีเซ็ต
              </button>
              <button
                onClick={handleExportData}
                className="flex items-center text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded border border-indigo-200 transition-colors"
                title="ดาวน์โหลดไฟล์ code สำหรับนำไปอัปเดต"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Export
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 mb-4">
            {boardGames.slice().reverse().map(game => (
              <div 
                key={game.id} 
                className={`flex items-center justify-between bg-gray-50 p-3 rounded-md border ${selectedIds.includes(game.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}
              >
                <div className="flex items-center overflow-hidden mr-2">
                  <img src={game.imageUrl} alt={game.name} className="w-12 h-12 object-cover rounded-md mr-4 flex-shrink-0 bg-gray-200" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-700 truncate">{game.name}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mr-2">{game.category || 'ไม่ระบุ'}</span>
                      {game.isPopular && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">ยอดนิยม</span>}
                    </div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                  checked={selectedIds.includes(game.id)}
                  onChange={() => handleCheckboxChange(game.id)}
                />
              </div>
            ))}
             {boardGames.length === 0 && <p className="text-gray-500 text-center">ยังไม่มีบอร์ดเกมในระบบ</p>}
          </div>

          {/* Action Buttons */}
          {(canEdit || canDelete) && (
            <div className="border-t pt-4 flex justify-end space-x-3 animate-fade-in">
              {canEdit && (
                <button
                  onClick={handleEditClick}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition duration-200 flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  แก้ไขบอร์ดเกม
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 flex items-center shadow-sm"
                >
                   <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  ลบบอร์ดเกม
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageGamesView;
