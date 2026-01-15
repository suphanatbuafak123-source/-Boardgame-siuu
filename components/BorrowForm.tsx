
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
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
      <button onClick={onBack} className="text-blue-600 hover:underline mb-4">&larr; กลับไปเลือกบอร์ดเกม</button>
      <h2 className="text-3xl font-bold mb-2 text-gray-800">กรอกข้อมูลผู้ยืม</h2>
      <p className="text-gray-500 mb-6">กรุณากรอกข้อมูลของท่านเพื่อดำเนินการยืม</p>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 flex items-center gap-3 animate-shake">
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
          <span className="font-bold">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="studentId" className="block text-sm font-bold text-gray-700 mb-1">เลขประจำตัวนักศึกษา (5 หลัก)</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            maxLength={5}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only numbers and max 5 chars
              if (/^\d*$/.test(val)) {
                setStudentId(val);
              }
            }}
            inputMode="numeric"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 transition-all outline-none ${
              studentId.length > 0 && studentId.length !== 5 
                ? 'border-red-300 bg-red-50 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
            placeholder="เช่น 12345"
            required
          />
          <p className={`mt-1.5 text-xs font-bold ${studentId.length > 0 && studentId.length !== 5 ? 'text-red-500' : 'text-gray-400'}`}>
            * ต้องมี 5 หลัก (ปัจจุบัน: {studentId.length}/5 หลัก)
          </p>
        </div>
        <div>
          <label htmlFor="classroom" className="block text-sm font-bold text-gray-700 mb-1">ห้องเรียน</label>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            placeholder="เช่น 000"
            required
          />
        </div>
        <div>
          <label htmlFor="numberOfPlayers" className="block text-sm font-bold text-gray-700 mb-1">จำนวนผู้เล่น</label>
          <input
            type="number"
            id="numberOfPlayers"
            value={numberOfPlayers}
            onChange={(e) => setNumberOfPlayers(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            placeholder="ระบุจำนวนผู้เล่น"
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="major" className="block text-sm font-bold text-gray-700 mb-1">สาขาวิชา</label>
          <select
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 bg-white outline-none"
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
          className="w-full bg-blue-600 text-white font-black py-4 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
        >
          {isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูล'}
        </button>
      </form>
    </div>
  );
};

export default BorrowForm;
