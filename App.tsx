
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BoardGame, View } from './types';
import { INITIAL_BOARD_GAMES } from './data/boardGames';
import Header from './components/Header';
import BoardGameList from './components/BoardGameList';
import ConfirmationModal from './components/ConfirmationModal';
import BorrowForm from './components/BorrowForm';
import ManageGamesView from './components/ManageGamesView';
import SearchView from './components/SearchView';
import ReturnHistoryView from './components/ReturnHistoryView';
import TransactionHistoryView from './components/TransactionHistoryView';
import PasswordModal from './components/PasswordModal';
import SeasonalEffect, { Season } from './components/SeasonalEffect';
import { fetchBorrowedItems, recordReturn } from './services/googleSheetService';

const EN_CHARS = "qwertyuiop[]asdfghjkl;'zxcvbnm,./QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>? ";
const TH_CHARS = "ๆไำพะัีรนยบลฟหกดเ้่าสวงผปแอิืทมใฝ๐\"ฎฑธํ๊ณฯญฐฅฤฆฏโ้็๋ษศซ.()ฉฮฺ์?ฒฬฬ ";

const smartTranslate = (text: string) => {
  const toEng = text.split('').map(char => {
    const index = TH_CHARS.indexOf(char);
    return index !== -1 ? EN_CHARS[index] : char;
  }).join('');
  const toThai = text.split('').map(char => {
    const index = EN_CHARS.indexOf(char);
    return index !== -1 ? TH_CHARS[index] : char;
  }).join('');
  return { toEng, toThai };
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.List);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [currentSeason, setCurrentSeason] = useState<Season>(() => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'summer';
    if (month >= 5 && month <= 9) return 'rainy';
    return 'winter';
  });

  const toggleSeason = () => {
    setCurrentSeason(prev => {
      if (prev === 'summer') return 'rainy';
      if (prev === 'rainy') return 'winter';
      return 'summer';
    });
  };

  const theme = useMemo(() => {
    switch (currentSeason) {
      case 'summer': return { 
        bg: 'bg-[#fff7ed]', 
        text: 'หน้าร้อน (Summer)', 
        primary: 'orange',
        accent: 'bg-orange-500', 
        btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30',
        ring: 'focus:ring-orange-100',
        border: 'border-orange-200',
        cardActive: 'border-orange-500 shadow-orange-500/20'
      };
      case 'rainy': return { 
        bg: 'bg-[#f0fdfa]', 
        text: 'หน้าฝน (Rainy)', 
        primary: 'teal',
        accent: 'bg-teal-500', 
        btn: 'bg-teal-600 hover:bg-teal-700 shadow-teal-500/30',
        ring: 'focus:ring-teal-100',
        border: 'border-teal-200',
        cardActive: 'border-teal-500 shadow-teal-500/20'
      };
      case 'winter': return { 
        bg: 'bg-[#f0f9ff]', 
        text: 'หน้าหนาว (Winter)', 
        primary: 'blue',
        accent: 'bg-blue-500', 
        btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30',
        ring: 'focus:ring-blue-100',
        border: 'border-blue-200',
        cardActive: 'border-blue-500 shadow-blue-500/20'
      };
    }
  }, [currentSeason]);

  const [boardGames, setBoardGames] = useState<BoardGame[]>(() => {
    try {
      const savedGames = localStorage.getItem('boardGames');
      return savedGames ? JSON.parse(savedGames) : INITIAL_BOARD_GAMES;
    } catch (error) {
      return INITIAL_BOARD_GAMES;
    }
  });

  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error', message: string} | null>(null);
  const scanBuffer = useRef('');

  useEffect(() => {
    localStorage.setItem('boardGames', JSON.stringify(boardGames));
  }, [boardGames]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        const text = scanBuffer.current.trim();
        if (text) processAutoReturn(text);
        scanBuffer.current = '';
      } else if (e.key.length === 1) {
        scanBuffer.current += e.key;
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [boardGames, view]);

  const processAutoReturn = async (scannedText: string) => {
    setIsProcessingScan(true);
    try {
      let foundGame = boardGames.find(g => g.barcode === scannedText);
      if (!foundGame) {
        const { toEng, toThai } = smartTranslate(scannedText);
        foundGame = boardGames.find(g => 
          g.name.toLowerCase() === scannedText.toLowerCase() ||
          g.name.toLowerCase() === toEng.toLowerCase() ||
          g.name.toLowerCase() === toThai.toLowerCase()
        );
      }
      if (!foundGame) {
        setScanResult({ status: 'error', message: `ไม่พบเกมหรือรหัส "${scannedText}"` });
      } else {
        const result = await fetchBorrowedItems();
        if (result.success && result.data) {
          const borrowedMatch = result.data.find((item: any) => item.gameName.toLowerCase() === foundGame!.name.toLowerCase());
          if (borrowedMatch) {
            const returnRes = await recordReturn(borrowedMatch.studentId, borrowedMatch.gameName);
            if (returnRes.success) {
              setScanResult({ status: 'success', message: `คืนสำเร็จ: ${borrowedMatch.gameName}` });
              setRefreshKey(prev => prev + 1);
            } else setScanResult({ status: 'error', message: 'คืนไม่สำเร็จ' });
          } else setScanResult({ status: 'error', message: `เกม "${foundGame.name}" ไม่ได้ถูกยืมอยู่` });
        }
      }
    } catch (err) {
      setScanResult({ status: 'error', message: 'การเชื่อมต่อขัดข้อง' });
    } finally {
      setIsProcessingScan(false);
      setTimeout(() => setScanResult(null), 5000);
    }
  };

  const selectedGames = useMemo(() => boardGames.filter(game => game.selected), [boardGames]);
  const handleToggleSelect = (id: number) => setBoardGames(prev => prev.map(g => g.id === id ? { ...g, selected: !g.selected } : g));
  const handleConfirmSelection = () => selectedGames.length > 0 ? setConfirmationModalOpen(true) : alert('กรุณาเลือกเกม');
  const handleProceedToBorrow = () => { setView(View.BorrowForm); setConfirmationModalOpen(false); };
  const handleBorrowSuccess = () => { setView(View.BorrowSuccess); setBoardGames(prev => prev.map(g => ({ ...g, selected: false }))); };

  const handleBackToList = () => setView(View.List);
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-all duration-1000 relative overflow-x-hidden ${theme.bg}`}>
      <SeasonalEffect season={currentSeason} />
      
      <Header 
        onReturnClick={() => setView(View.ReturnList)} 
        onManageClick={() => setIsPasswordModalOpen(true)} 
        onSearchClick={() => setView(View.Search)} 
        onHistoryClick={() => setView(View.TransactionHistory)}
        season={currentSeason}
        theme={theme}
      />
      
      <main className="container mx-auto px-4 py-8 relative z-10 min-h-[calc(100vh-100px)]">
        {/* Dynamic Badge with Toggle Capability */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={toggleSeason}
            title="คลิกเพื่อสลับฤดูกาล"
            className="group bg-white/80 backdrop-blur-md px-6 py-2 rounded-full text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-lg border border-white/50 flex items-center gap-3 animate-slide-up hover:scale-110 transition-transform active:scale-95"
          >
             <span className={`w-3 h-3 rounded-full ${theme.accent} animate-ping`}></span>
             {theme.text}
             <svg className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>

        {/* Content Render - Passing theme where needed */}
        {view === View.Search && <SearchView theme={theme} boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} onBack={handleBackToList} />}
        {view === View.ReturnList && <ReturnHistoryView theme={theme} boardGames={boardGames} onBack={handleBackToList} key={`ret-${refreshKey}`} />}
        {view === View.TransactionHistory && <TransactionHistoryView theme={theme} onBack={handleBackToList} key={`his-${refreshKey}`} />}
        {view === View.BorrowForm && <BorrowForm theme={theme} selectedGames={selectedGames} onSuccess={handleBorrowSuccess} onBack={handleBackToList} />}
        {view === View.ManageGames && <ManageGamesView theme={theme} boardGames={boardGames} onAddGame={(n:any)=>setBoardGames([...boardGames, {...n, id:Date.now(), selected:false}])} onUpdateGame={(u)=>setBoardGames(boardGames.map(g=>g.id===u.id?u:g))} onDeleteGames={(ids)=>setBoardGames(boardGames.filter(g=>!ids.includes(g.id)))} onResetData={()=>{setBoardGames(INITIAL_BOARD_GAMES); localStorage.removeItem('boardGames');}} onBack={handleBackToList} />}
        {view === View.BorrowSuccess && (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white/90 backdrop-blur-xl shadow-2xl rounded-[50px] max-w-lg mx-auto mt-20 animate-scale-in border-b-[15px] border-green-500">
            <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce-short"><svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
            <h2 className="text-4xl font-black text-slate-800 mb-3">ยืมสำเร็จ!</h2>
            <p className="text-slate-500 mb-10 font-bold italic">อย่าลืมดูแลบอร์ดเกมและคืนตามเวลาที่กำหนดนะ</p>
            <button onClick={handleBackToList} className={`${theme.btn} w-full text-white font-black py-5 px-8 rounded-3xl transition-all shadow-xl text-xl`}>กลับหน้าหลัก</button>
          </div>
        )}
        {view === View.List && <BoardGameList theme={theme} boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} />}
      </main>

      {/* Seasonal Selection Bar */}
      {(view === View.List || view === View.Search) && selectedGames.length > 0 && (
        <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/10 p-5 rounded-[35px] z-[200] shadow-[0_25px_60px_rgba(0,0,0,0.4)] flex items-center justify-between px-10 animate-scale-in">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className={`text-${theme.primary}-400 text-[10px] font-black uppercase tracking-widest mb-1 transition-colors`}>Queue</span>
              <span className="text-white font-black text-2xl">{selectedGames.length} <span className="text-sm font-bold text-slate-400">เกม</span></span>
            </div>
            <div className="h-10 w-[1px] bg-white/10"></div>
            <div className="flex -space-x-3 overflow-hidden">
               {selectedGames.slice(0,3).map(g => (
                 <img key={g.id} src={g.imageUrl} className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" />
               ))}
               {selectedGames.length > 3 && <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold">+{selectedGames.length-3}</div>}
            </div>
          </div>
          <button
            onClick={handleConfirmSelection}
            className={`${theme.btn} text-white font-black py-4 px-12 rounded-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 text-lg`}
          >
            <span>ยืมเลย</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </footer>
      )}

      {isConfirmationModalOpen && <ConfirmationModal theme={theme} selectedGames={selectedGames} onClose={() => setConfirmationModalOpen(false)} onConfirm={handleProceedToBorrow} />}
      {isPasswordModalOpen && <PasswordModal theme={theme} onClose={() => setIsPasswordModalOpen(false)} onSuccess={() => {setIsPasswordModalOpen(false); setView(View.ManageGames);}} />}
      
      {isProcessingScan && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[2000] flex items-center justify-center">
          <div className="bg-white rounded-[50px] p-12 flex flex-col items-center shadow-2xl animate-scale-in border-4 border-blue-500">
            <div className={`w-20 h-20 border-8 border-${theme.primary}-600 border-t-transparent rounded-full animate-spin mb-6`}></div>
            <p className="text-slate-800 font-black text-2xl">กำลังตรวจสอบรหัส...</p>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[2001] w-[90%] max-w-md animate-bounce-short">
          <div className={`${scanResult.status === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-10 py-8 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white/30 flex flex-col items-center text-center backdrop-blur-lg`}>
            <div className="mb-4">{scanResult.status === 'success' ? '✅' : '❌'}</div>
            <p className="font-black text-2xl mb-2">{scanResult.message}</p>
            <button onClick={() => setScanResult(null)} className="mt-4 bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-xs font-bold transition-all">รับทราบ</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up-fade { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes bounce-short { 0%, 100% {transform: translateY(0) translateX(-50%);} 50% {transform: translateY(-15px) translateX(-50%);} }
        .animate-slide-up { animation: slide-up-fade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-bounce-short { animation: bounce-short 0.6s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
