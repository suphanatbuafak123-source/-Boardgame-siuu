
import React, { useState } from 'react';
import { BoardGame } from '../types';
import { recordBorrowing } from '../services/googleSheetService';

interface BorrowFormProps {
  selectedGames: BoardGame[];
  onSuccess: () => void;
  onBack: () => void;
}

const MAJORS = [
  'การบัญชี',
  'การตลาด',
  'คอมพิวเตอร์ธุรกิจ',
  'ภาษาต่างประเทศ',
];

const BorrowForm: React.FC<BorrowFormProps> = ({ selectedGames, onSuccess, onBack }) => {
  const [studentId, setStudentId] = useState('');
  const [classroom, setClassroom] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState('');
  const [major, setMajor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบความครบถ้วน
    if (!studentId || !classroom || !numberOfPlayers || !major) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    // ตรวจสอบความยาวรหัสนักศึกษา (ต้องเท่ากับ 5 ตัว)
    if (studentId.length !== 5) {
      setError('เลขประจำตัวนักศึกษาต้องมี 5 หลักเท่านั้น');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await recordBorrowing({
        studentId: studentId.trim(),
        classroom: classroom.trim(),
        numberOfPlayers: numberOfPlayers.trim(),
        major,
        games: selectedGames.map(g => g.name),
      });
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 animate-slide-up">
      <button onClick={onBack} className="text-slate-400 hover:text-blue-600 font-bold mb-6 flex items-center transition-colors">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        ย้อนกลับ
      </button>
      <h2 className="text-3xl font-black mb-2 text-slate-800">กรอกข้อมูลผู้ยืม</h2>
      <p className="text-slate-500 mb-8 font-medium">กรุณาระบุข้อมูลเพื่อดำเนินการยืมบอร์ดเกม</p>

      {error && (
        <div className="bg-red-50 border-2 border-red-100 text-red-600 p-4 rounded-2xl mb-8 flex items-center gap-3 animate-shake">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          <span className="font-bold">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="studentId" className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">รหัสประจำตัว (5 หลัก)</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            maxLength={5}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setStudentId(val);
              }
            }}
            inputMode="numeric"
            className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 transition-all outline-none text-lg font-bold ${
              studentId.length > 0 && studentId.length !== 5 
                ? 'border-red-300 ring-red-100 focus:ring-red-100' 
                : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
            }`}
            placeholder="เช่น 12345"
            required
          />
          <p className={`mt-2 text-xs font-black ${studentId.length > 0 && studentId.length !== 5 ? 'text-red-500' : 'text-slate-400'}`}>
            * {studentId.length}/5 หลัก
          </p>
        </div>
        <div>
          <label htmlFor="classroom" className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">ห้องเรียน (ระบุตัวเลข)</label>
          <input
            type="text"
            id="classroom"
            value={classroom}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                setClassroom(val);
              }
            }}
            inputMode="numeric"
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold"
            placeholder="เช่น 311"
            required
          />
        </div>
        <div>
          <label htmlFor="numberOfPlayers" className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">จำนวนผู้เล่น</label>
          <input
            type="number"
            id="numberOfPlayers"
            value={numberOfPlayers}
            onChange={(e) => setNumberOfPlayers(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold"
            placeholder="กี่คน?"
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="major" className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">สาขาวิชา</label>
          <select
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold cursor-pointer"
            required
          >
            <option value="">-- เลือกสาขา --</option>
            {MAJORS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading || (studentId.length > 0 && studentId.length !== 5)}
          className="w-full bg-blue-600 text-white font-black py-5 px-6 rounded-2xl hover:bg-blue-700 transition duration-300 ease-in-out disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 transform active:scale-95"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>กำลังส่งข้อมูล...</span>
            </div>
          ) : 'ยืนยันการยืม'}
        </button>
      </form>
    </div>
  );
};

export default BorrowForm;
