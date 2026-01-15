
import React, { useState, useEffect, useCallback } from 'react';
import { BoardGame } from '../types';
import { recordReturn, fetchBorrowedItems } from '../services/googleSheetService';

interface ReturnHistoryViewProps {
  boardGames: BoardGame[];
  onBack: () => void;
}

interface BorrowedItem {
  gameName: string;
  studentId: string;
  classroom: string;
  major: string;
  timestamp: string;
  borrowTime: string;
}

const ReturnHistoryView: React.FC<ReturnHistoryViewProps> = ({ boardGames, onBack }) => {
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isConfirmingReturn, setIsConfirmingReturn] = useState<null | BorrowedItem>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchBorrowedItems();
      if (result.success && result.data) {
        setBorrowedItems(result.data);
      } else {
        setError(result.message || 'ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReturn = async () => {
    if (!isConfirmingReturn) return;
    
    if (studentIdInput !== isConfirmingReturn.studentId) {
      alert('รหัสนักศึกษาไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await recordReturn(studentIdInput, isConfirmingReturn.gameName);
      if (result.success) {
        alert('คืนบอร์ดเกมสำเร็จ!');
        setIsConfirmingReturn(null);
        setStudentIdInput('');
        loadData(); // รีโหลดข้อมูลหลังคืนสำเร็จ
      } else {
        alert(result.message || 'ไม่สามารถทำรายการได้');
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGameImage = (name: string) => {
    const game = boardGames.find(g => g.name === name);
    return game?.imageUrl || "https://picsum.photos/seed/default/400/300";
  };

  const getGameCategory = (name: string) => {
    const game = boardGames.find(g => g.name === name);
    return game?.category || "บอร์ดเกม";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 flex items-center font-bold transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับหน้าหลัก
        </button>
        <h2 className="text-4xl font-black text-slate-800 text-center flex-1 pr-20">ประวัติการยืม</h2>
        <button 
          onClick={loadData} 
          disabled={isLoading}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50" 
          title="รีเฟรชข้อมูล"
        >
          <svg className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border-2 border-red-100 p-12 rounded-[40px] text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h3 className="text-2xl font-black text-red-800 mb-2">การเชื่อมต่อขัดข้อง</h3>
          <p className="text-red-600/70 mb-8 font-medium">{error}</p>
          <button 
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-red-600/20 transition-all transform hover:scale-105 active:scale-95"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold">กำลังดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {borrowedItems.map((item, index) => (
            <div key={index} className="flex gap-6 group animate-scale-in">
              <div className="relative flex-shrink-0">
                <div className="w-32 h-44 md:w-36 md:h-48 rounded-lg overflow-hidden shadow-md border border-slate-200 transition-transform duration-300 group-hover:-translate-y-1">
                  <img src={getGameImage(item.gameName)} alt={item.gameName} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-0 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-r shadow-sm">GAME</div>
                </div>
              </div>

              <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-blue-800 leading-tight truncate" title={item.gameName}>
                    {item.gameName}
                  </h3>
                  <p className="text-slate-500 text-sm font-medium">ทีมงาน {getGameCategory(item.gameName)}</p>
                  
                  <div className="space-y-0.5 pt-2">
                    <div className="flex text-xs text-slate-400 font-bold uppercase tracking-tight">
                      <span className="w-20">วันที่ยืม</span>
                      <span className="text-slate-600">{item.timestamp?.split(' ')[0] || '-'}</span>
                    </div>
                    <div className="flex text-xs text-slate-400 font-bold uppercase tracking-tight pt-1">
                      <span className="w-20">ผู้ยืม</span>
                      <span className="text-slate-700 font-black">{item.studentId}</span>
                    </div>
                    <div className="flex text-xs text-slate-400 font-bold uppercase tracking-tight">
                      <span className="w-20">ห้อง/สาขา</span>
                      <span className="text-slate-600 truncate">{item.classroom} - {item.major}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfirmingReturn(item)}
                  className="mt-4 bg-[#f15a24] hover:bg-[#d44a1b] text-white text-sm font-black py-2.5 px-8 rounded-full shadow-lg shadow-orange-500/20 transform hover:scale-105 active:scale-95 transition-all w-fit"
                >
                  คืนสื่อ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isConfirmingReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-black text-slate-800 mb-2">ยืนยันการคืน</h3>
            <p className="text-slate-500 text-sm mb-6">กรุณากรอกรหัสนักศึกษา <span className="font-black text-slate-800">{isConfirmingReturn.studentId}</span> เพื่อคืนเกม <span className="font-bold text-blue-600">{isConfirmingReturn.gameName}</span></p>
            
            <input
              autoFocus
              type="text"
              placeholder="กรอกรหัสนักศึกษาเพื่อยืนยัน"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
              className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg mb-6 text-center"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => {setIsConfirmingReturn(null); setStudentIdInput('');}}
                className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                ยกเลิก
              </button>
              <button 
                disabled={isSubmitting || !studentIdInput}
                onClick={handleReturn}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? <span className="animate-spin block h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : 'ยืนยันการคืน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && borrowedItems.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p className="text-slate-400 font-bold text-xl">ขณะนี้ไม่มีบอร์ดเกมที่ถูกยืมอยู่</p>
          <button onClick={onBack} className="mt-6 text-blue-600 font-bold hover:underline">ไปยืมบอร์ดเกมเลย!</button>
        </div>
      )}
    </div>
  );
};

export default ReturnHistoryView;
