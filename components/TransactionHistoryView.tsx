
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllTransactions } from '../services/googleSheetService';

interface TransactionHistoryViewProps {
  onBack: () => void;
}

interface Transaction {
  playerCount: number;
  date: string;
  classroom: string;
  studentId: string;
  major: string;
  gameName: string;
  borrowTime: string;
  returnTime: string | null;
}

const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAllTransactions();
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        setError(result.message || 'ไม่สามารถโหลดประวัติได้');
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

  // แก้ไขฟังก์ชันแสดงวันที่ให้เป็นปี พ.ศ.
  const formatDate = (dateStr: any) => {
    if (!dateStr || dateStr === "-") return "-";
    try {
      // พยายามแยกวันที่ออกจาก String (เช่น "2024-05-20" หรือ "2024-05-20 14:00:00")
      const onlyDate = String(dateStr).split(' ')[0];
      const d = new Date(onlyDate);
      
      if (isNaN(d.getTime())) {
        return String(dateStr);
      }
      
      // ใช้ th-TH เพื่อให้แสดงเป็นปี พ.ศ. (เช่น 2567)
      return d.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return String(dateStr);
    }
  };

  // ฟังก์ชันล้างค่าเวลา (ในกรณีที่ Script ส่งมาเป็น String ที่มีวันที่ติดมาด้วย)
  const formatTime = (timeStr: string | null) => {
    if (!timeStr || timeStr === "-") return "-";
    // ถ้ามีช่องว่าง (แสดงว่าเป็น Date ISO String) ให้เอาเฉพาะส่วนเวลา
    if (timeStr.includes('T')) {
        return timeStr.split('T')[1].split('.')[0];
    }
    // ถ้ามีวันที่ติดมาแบบ "2024-05-20 14:00:00" ให้เอาเฉพาะ 14:00:00
    if (timeStr.includes(' ')) {
        const parts = timeStr.split(' ');
        return parts[parts.length - 1];
    }
    return timeStr;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <button onClick={onBack} className="text-slate-500 hover:text-blue-600 flex items-center font-bold transition-colors self-start">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับหน้าหลัก
        </button>
        <h2 className="text-3xl font-black text-slate-800 text-center flex-1">ประวัติการยืม-คืนทั้งหมด</h2>
        <button onClick={loadData} disabled={isLoading} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-all disabled:opacity-50 self-end">
          <svg className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold">กำลังดึงข้อมูลประวัติ...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-100 p-12 rounded-[40px] text-center max-w-2xl mx-auto">
          <h3 className="text-2xl font-black text-red-800 mb-2">ไม่สามารถดึงข้อมูลได้</h3>
          <p className="text-red-600 mb-8">{error}</p>
          <button onClick={loadData} className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-10 rounded-2xl">ลองใหม่</button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold text-xl">ยังไม่มีประวัติการทำรายการในระบบ</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-5">วันที่</th>
                  <th className="px-6 py-5">ชื่อบอร์ดเกม</th>
                  <th className="px-6 py-5">ผู้ยืม</th>
                  <th className="px-6 py-5">ห้อง/สาขา</th>
                  <th className="px-6 py-5">เวลายืม</th>
                  <th className="px-6 py-5">เวลาคืน</th>
                  <th className="px-6 py-5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium text-sm whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-800 font-black text-base">{t.gameName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-blue-600 font-bold">{t.studentId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-500 text-xs font-bold uppercase">{t.classroom} | {t.major}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium whitespace-nowrap">
                      {formatTime(t.borrowTime)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm font-medium whitespace-nowrap">
                      {formatTime(t.returnTime)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {t.returnTime ? (
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full">คืนแล้ว</span>
                      ) : (
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1.5 rounded-full animate-pulse">ยังไม่คืน</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryView;
