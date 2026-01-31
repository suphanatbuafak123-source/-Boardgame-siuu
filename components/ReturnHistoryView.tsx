
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  borrowTimestamp: string; 
}

const ReturnHistoryView: React.FC<ReturnHistoryViewProps> = ({ boardGames, onBack }) => {
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [isConfirmingReturn, setIsConfirmingReturn] = useState<null | BorrowedItem>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);
  
  const [scanBuffer, setScanBuffer] = useState('');
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchBorrowedItems();
      if (result.success) {
        setBorrowedItems(result.data || []);
      } else {
        setBorrowedItems([]);
        if (result.message) setError(result.message);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const focusScanner = () => {
      if (!isConfirmingReturn && !showSuccess && scannerInputRef.current) {
        scannerInputRef.current.focus();
      }
    };

    focusScanner();
    const interval = setInterval(focusScanner, 1000);
    return () => clearInterval(interval);
  }, [isConfirmingReturn, showSuccess]);

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const scannedText = scanBuffer.trim();
      if (!scannedText) return;

      // --- แก้ไขตรรกะการค้นหาให้เหมือนหน้าหลัก ---
      
      // 1. หาว่ารหัสที่สแกนมาคือเกมอะไรในฐานข้อมูลหลัก (เช็ค Barcode ก่อน)
      let foundInLibrary = boardGames.find(g => g.barcode === scannedText);
      
      // 2. ถ้าไม่เจอ Barcode ให้ลองเช็คว่าสแกนมาเป็นชื่อเกมตรงๆ หรือไม่
      if (!foundInLibrary) {
        foundInLibrary = boardGames.find(g => g.name.toLowerCase() === scannedText.toLowerCase());
      }

      if (!foundInLibrary) {
        setReturnError(`ไม่พบรหัสหรือชื่อเกม "${scannedText}" ในระบบ`);
        setScanBuffer('');
        return;
      }

      // 3. เมื่อรู้ชื่อเกมแล้ว ค่อยไปหาในรายการที่ "กำลังยืมอยู่"
      const matchInBorrowed = borrowedItems.find(item => 
        item.gameName.toLowerCase() === foundInLibrary!.name.toLowerCase()
      );

      if (matchInBorrowed) {
        setReturnError(null);
        setIsSubmitting(true);
        try {
          const result = await recordReturn(matchInBorrowed.studentId, matchInBorrowed.gameName);
          if (result.success) {
            setShowSuccess(true);
          } else {
            setReturnError(result.message || 'เกิดข้อผิดพลาดในการคืน');
          }
        } catch (err) {
          setReturnError('การเชื่อมต่อขัดข้อง');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setReturnError(`เกม "${foundInLibrary.name}" ไม่ได้ถูกยืมอยู่ในขณะนี้`);
      }
      setScanBuffer('');
    }
  };

  const handleManualReturn = async () => {
    if (!isConfirmingReturn) return;
    
    const inputId = studentIdInput.trim();
    const targetId = String(isConfirmingReturn.studentId).trim();
    
    if (inputId.length !== 5) {
      setReturnError('รหัสนักศึกษาต้องมี 5 หลัก');
      return;
    }
    
    if (inputId !== targetId) {
      setReturnError('รหัสประจำตัวไม่ถูกต้อง');
      return;
    }

    setIsSubmitting(true);
    setReturnError(null);
    try {
      const result = await recordReturn(inputId, isConfirmingReturn.gameName);
      if (result.success) {
        setIsConfirmingReturn(null);
        setStudentIdInput('');
        setShowSuccess(true);
      } else {
        setReturnError(result.message || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      setReturnError('การเชื่อมต่อขัดข้อง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGameImage = (name: string) => boardGames.find(g => g.name === name)?.imageUrl || "https://picsum.photos/400/300";

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white shadow-2xl rounded-[40px] max-w-lg mx-auto mt-10 animate-scale-in border-4 border-green-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-3">สำเร็จ!</h2>
        <p className="text-blue-600 font-bold text-xl mb-10">ระบบบันทึกการคืนเรียบร้อยแล้ว</p>
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={() => { setShowSuccess(false); loadData(); }} 
            className="w-full bg-slate-100 text-slate-700 font-black py-4 rounded-2xl hover:bg-slate-200 transition-all"
          >
            ดูรายการยืมอื่น
          </button>
          <button 
            onClick={onBack} 
            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-blue-700 transition-all"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in relative">
      <input
        ref={scannerInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        value={scanBuffer}
        onChange={(e) => setScanBuffer(e.target.value)}
        onKeyDown={handleScan}
      />

      {isSubmitting && !isConfirmingReturn && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[200] flex items-center justify-center">
            <div className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-black text-slate-800 text-lg">กำลังทำรายการคืนอัตโนมัติ...</span>
            </div>
        </div>
      )}

      {returnError && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-xl animate-bounce-short">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span className="font-black text-lg">{returnError}</span>
            </div>
            <button onClick={() => setReturnError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 flex items-center font-bold self-start md:self-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับหน้าหลัก
        </button>
        
        <div className="text-center flex-1">
          <h2 className="text-3xl md:text-4xl font-black text-slate-800">รายการบอร์ดเกมที่กำลังยืม</h2>
          <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <p className="text-blue-600 font-black text-xs uppercase tracking-widest">Scanner Active: ยิง QR เพื่อคืนอัตโนมัติ</p>
          </div>
        </div>

        <button onClick={loadData} disabled={isLoading} className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50">
          <svg className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold">กำลังดึงข้อมูล...</p>
        </div>
      ) : borrowedItems.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold text-xl">ไม่มีบอร์ดเกมที่กำลังถูกใช้งาน</p>
          <button onClick={onBack} className="mt-4 text-blue-600 font-bold hover:underline">เลือกเกมเพื่อยืม</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {borrowedItems.map((item, index) => (
            <div key={index} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl transition-all group overflow-hidden">
              <div className="flex gap-4 mb-6">
                <img 
                  src={getGameImage(item.gameName)} 
                  alt={item.gameName} 
                  className="w-24 h-32 object-cover rounded-2xl shadow-md border border-slate-50 group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-800 leading-tight mb-3 truncate" title={item.gameName}>
                    {item.gameName}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ผู้ยืม (Student ID)</span>
                      <span className="text-blue-600 font-black text-lg">{item.studentId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ห้อง / สาขา</span>
                      <span className="text-slate-600 text-xs font-bold truncate">{item.classroom} | {item.major}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => { setReturnError(null); setIsConfirmingReturn(item); }}
                className="mt-4 bg-[#f15a24] hover:bg-[#d44a1b] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/20 transform active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2z"></path></svg>
                คืนบอร์ดเกม
              </button>
            </div>
          ))}
        </div>
      )}

      {isConfirmingReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`bg-white rounded-[32px] p-8 w-full max-w-sm mx-auto shadow-2xl border-4 ${returnError ? 'border-red-500 animate-shake' : 'border-blue-500'} transition-colors animate-scale-in`}>
            <div className="flex justify-center mb-4">
              <img src={getGameImage(isConfirmingReturn.gameName)} alt="" className="w-20 h-20 object-cover rounded-xl shadow-md border-2 border-white" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-1 text-center">คืนเกม: {isConfirmingReturn.gameName}</h3>
            <p className="text-slate-500 text-sm mb-6 font-bold text-center">กรุณากรอกรหัสนักศึกษา 5 หลักของผู้ยืม ({isConfirmingReturn.studentId}) เพื่อยืนยัน</p>
            <input
              autoFocus
              type="text"
              maxLength={5}
              placeholder="กรอกรหัส 5 หลัก"
              value={studentIdInput}
              onChange={(e) => {
                const val = e.target.value;
                if (/^\d*$/.test(val)) {
                  setStudentIdInput(val);
                  if (returnError) setReturnError(null);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleManualReturn()}
              className={`w-full px-6 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 outline-none font-black text-center text-xl mb-6 shadow-inner transition-all ${returnError ? 'ring-red-500 ring-2 bg-red-50' : 'focus:ring-blue-500'}`}
            />
            <div className="flex gap-4">
              <button onClick={() => { setIsConfirmingReturn(null); setStudentIdInput(''); setReturnError(null); }} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors">ยกเลิก</button>
              <button 
                disabled={isSubmitting || studentIdInput.length !== 5}
                onClick={handleManualReturn}
                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isSubmitting ? <span className="animate-spin block h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes bounce-short {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);}
          40% {transform: translateY(-10px) translateX(-50%);}
          60% {transform: translateY(-5px) translateX(-50%);}
        }
        .animate-bounce-short {
          animation: bounce-short 1s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default ReturnHistoryView;
