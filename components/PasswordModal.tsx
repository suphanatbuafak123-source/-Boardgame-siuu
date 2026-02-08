
import React, { useState } from 'react';

interface PasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
  // Added theme prop to fix TypeScript error
  theme?: any;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSuccess, theme }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const primaryColor = theme?.primary || 'blue';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ตรวจสอบรหัสผ่าน 1234
    if (password === '0000') {
      onSuccess();
    } else {
      setError(true);
      setPassword('');
      // แสดง animation สั่น 0.5 วินาที
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className={`bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl border-4 ${error ? 'border-red-500 animate-shake' : `border-${primaryColor}-500`} transition-all animate-scale-in`}>
        <div className={`w-16 h-16 bg-${primaryColor}-50 rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
          <svg className={`w-8 h-8 text-${primaryColor}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-black text-slate-800 mb-2 text-center">รหัสผ่านผู้ดูแล</h3>
        <p className="text-slate-500 text-sm mb-8 font-bold text-center">เฉพาะเจ้าหน้าที่เท่านั้นที่สามารถเข้าถึงส่วนนี้ได้</p>
        
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="password"
            placeholder="****"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-6 py-5 bg-slate-50 border-none rounded-2xl focus:ring-4 outline-none font-black text-center text-4xl mb-8 tracking-[0.5em] shadow-inner transition-all ${error ? 'ring-red-200' : `focus:ring-${primaryColor}-100`}`}
          />
          
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className={`flex-1 bg-${primaryColor}-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-${primaryColor}-500/20 hover:bg-${primaryColor}-700 transition-all transform active:scale-95`}
            >
              ตกลง
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default PasswordModal;
