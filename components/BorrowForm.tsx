
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
    if (!studentId || !classroom || !numberOfPlayers || !major) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
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

      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัวนักศึกษา</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only numbers
              if (/^\d*$/.test(val)) {
                setStudentId(val);
              }
            }}
            inputMode="numeric"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="เช่น 10957"
            required
          />
        </div>
        <div>
          <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-1">ห้องเรียน</label>
          <input
            type="text"
            id="classroom"
            value={classroom}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only numbers
              if (/^\d*$/.test(val)) {
                setClassroom(val);
              }
            }}
            inputMode="numeric"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="เช่น 000"
            required
          />
        </div>
        <div>
          <label htmlFor="numberOfPlayers" className="block text-sm font-medium text-gray-700 mb-1">จำนวนผู้เล่น</label>
          <input
            type="number"
            id="numberOfPlayers"
            value={numberOfPlayers}
            onChange={(e) => setNumberOfPlayers(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="ระบุจำนวนผู้เล่น"
            min="1"
            required
          />
        </div>
        <div>
          <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">สาขาวิชา</label>
          <select
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
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
          disabled={isLoading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out disabled:bg-gray-400 disabled:cursor-wait focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isLoading ? 'กำลังส่งข้อมูล...' : 'ส่งข้อมูล'}
        </button>
      </form>
    </div>
  );
};

export default BorrowForm;
    