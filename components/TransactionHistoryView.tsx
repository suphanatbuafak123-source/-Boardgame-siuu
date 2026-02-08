
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllTransactions } from '../services/googleSheetService';

interface TransactionHistoryViewProps {
  onBack: () => void;
  // Added theme prop to fix TypeScript error
  theme?: any;
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

const thaiMonthsFull = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const TransactionHistoryView: React.FC<TransactionHistoryViewProps> = ({ onBack, theme }) => {
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

  const formatThaiDate = (dateStr: string) => {
    if (!dateStr || dateStr === "-") return "-";
    const cleanDate = dateStr.split(' ')[0]; 
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
    return `${day} ${thaiMonthsFull[month - 1]} ${year + 543}`;
  };

  const formatCleanTime = (timeStr: string | null) => {
    if (!timeStr || timeStr === "-" || timeStr === "null") return "-";
    let timeOnly = timeStr;
    if (timeStr.includes(' ')) {
      timeOnly = timeStr.split(' ')[1];
    } else if (timeStr.includes('T')) {
      timeOnly = timeStr.split('T')[1].split('.')[0];
    }
    const timeParts = timeOnly.split(':');
    if (timeParts.length >= 2) {
      return `${timeParts[0]}:${timeParts[1]} น.`;
    }
    return timeOnly;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up">
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
        <button onClick={onBack} className="text-slate-400 hover:text-blue-600 flex items-center font-bold transition-colors self-start">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          กลับหน้าหลัก
        </button>
        <div className="text-center flex-1">
            <h2 className="text-3xl font-black text-slate-800">ประวัติการยืม-คืน</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Transaction Logs</p>
        </div>
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
        <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold text-xl">ยังไม่มีประวัติการทำรายการในระบบ</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-5">วันที่ทำรายการ</th>
                  <th className="px-6 py-5">ชื่อบอร์ดเกม</th>
                  <th className="px-6 py-5">รหัสนักศึกษา</th>
                  <th className="px-6 py-5">ห้อง/สาขา</th>
                  <th className="px-6 py-5">เวลายืม</th>
                  <th className="px-6 py-5">เวลาคืน</th>
                  <th className="px-6 py-5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((t, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-slate-600 font-bold text-sm">{formatThaiDate(t.date)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-800 font-black text-base group-hover:text-blue-700 transition-colors">{t.gameName}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-blue-600 font-black">{t.studentId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-500 text-xs font-bold uppercase">{t.classroom} | {t.major}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-600 text-sm font-bold bg-slate-100 inline-block px-2 py-1 rounded-lg">
                        {formatCleanTime(t.borrowTime)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p className={`text-sm font-bold inline-block px-2 py-1 rounded-lg ${t.returnTime ? 'text-slate-600 bg-slate-100' : 'text-slate-300'}`}>
                        {formatCleanTime(t.returnTime)}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {t.returnTime ? (
                        <div className="flex flex-col items-center">
                            <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-full ring-1 ring-green-200">คืนแล้ว</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                            <span className="bg-orange-100 text-orange-700 text-[10px] font-black px-3 py-1.5 rounded-full animate-pulse ring-1 ring-orange-200">ยังไม่คืน</span>
                        </div>
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
