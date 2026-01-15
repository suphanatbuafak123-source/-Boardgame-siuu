
import React, { useState, useEffect } from 'react';
import { BoardGame } from '../types';
import { recordReturn } from '../services/googleSheetService';

interface ReturnModalProps {
  boardGames: BoardGame[];
  onClose: () => void;
}

const ReturnModal: React.FC<ReturnModalProps> = ({ boardGames, onClose }) => {
  const [studentId, setStudentId] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggleGame = (gameName: string) => {
    setSelectedGames(prev => 
      prev.includes(gameName) 
        ? prev.filter(name => name !== gameName) 
        : [...prev, gameName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || selectedGames.length === 0) {
      setError('กรุณากรอกรหัสนักศึกษาและเลือกเกมที่ต้องการคืน');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const returnPromises = selectedGames.map(gameName => recordReturn(studentId, gameName));
      const results = await Promise.all(returnPromises);
      
      const firstFailedResult = results.find(res => !res.success);
      if (firstFailedResult) {
        throw new Error(firstFailedResult.message || 'การคืนเกมบางรายการล้มเหลว');
      }

      alert('คืนบอร์ดเกมสำเร็จ!');
      onClose();
    } catch (err) {
      const errorMessage = (err instanceof Error) ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGames = boardGames.filter(game => 
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-gray-100 bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-800">คืนบอร์ดเกม</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Return Process</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Student ID Input */}
            <div>
              <label htmlFor="returnStudentId" className="block text-sm font-bold text-slate-700 mb-2">เลขประจำตัวนักศึกษา</label>
              <div className="relative">
                <input
                  type="text"
                  id="returnStudentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800 font-semibold"
                  placeholder="กรอกรหัสนักศึกษา 5 หลัก"
                  required
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
              </div>
            </div>

            {/* Game Selector Trigger */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">บอร์ดเกมที่ต้องการคืน</label>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800">
                      {selectedGames.length === 0 ? 'กดเพื่อเลือกเกม' : `เลือกแล้ว ${selectedGames.length} รายการ`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedGames.length === 0 ? 'ระบุชื่อบอร์ดเกมที่ท่านยืมไป' : selectedGames.slice(0, 2).join(', ') + (selectedGames.length > 2 ? '...' : '')}
                    </p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || selectedGames.length === 0}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-green-500/30 disabled:bg-slate-200 disabled:shadow-none disabled:text-slate-400 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังดำเนินการ...
                </>
              ) : (
                'ยืนยันการคืนบอร์ดเกม'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Game Selector Popup Overlay */}
      {isSelectorOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
            {/* Selector Header */}
            <div className="p-8 pb-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-3xl font-black text-slate-800">เลือกบอร์ดเกมที่ต้องการคืน</h3>
                <p className="text-slate-500">เลือกเกมที่ท่านยืมไปจากรายการด้านล่าง</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="ค้นหาชื่อเกม..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-72 pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-slate-50/50">
              {filteredGames.map(game => {
                const isSelected = selectedGames.includes(game.name);
                return (
                  <div 
                    key={game.id}
                    onClick={() => handleToggleGame(game.name)}
                    className={`group relative flex flex-col cursor-pointer bg-white rounded-3xl overflow-hidden border-4 transition-all duration-300 transform hover:scale-[1.03] active:scale-95 shadow-sm hover:shadow-xl ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-transparent'
                    }`}
                  >
                    {/* Image Container with fixed aspect ratio to fit the card well */}
                    <div className="w-full aspect-[4/3] overflow-hidden bg-slate-200">
                      <img 
                        src={game.imageUrl} 
                        alt={game.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    </div>
                    
                    {/* Text Container below image */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className={`font-black text-sm md:text-base leading-tight mb-1 line-clamp-2 ${isSelected ? 'text-green-700' : 'text-slate-800'}`}>
                        {game.name}
                      </h4>
                      <div className="mt-auto">
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                          {game.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full shadow-lg z-10 animate-scale-in">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredGames.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                  <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p className="text-lg">ไม่พบเกมที่ตรงกับคำค้นหา</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-white">
              <div className="hidden md:block">
                <span className="text-slate-500 font-medium">เลือกแล้ว </span>
                <span className="text-2xl font-black text-green-600">{selectedGames.length}</span>
                <span className="text-slate-500 font-medium"> รายการ</span>
              </div>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className="w-full md:w-auto px-12 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
              >
                ยืนยันการเลือก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnModal;
