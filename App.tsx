
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
  
  // Seasonal Logic with State to allow manual override
  const [currentSeason, setCurrentSeason] = useState<Season>(() => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'summer';
    if (month >= 5 && month <= 9) return 'rainy';
    return 'winter';
  });

  const themeConfig = useMemo(() => {
    switch (currentSeason) {
      case 'summer': return { bg: 'bg-orange-50', header: 'border-orange-200', text: 'หน้าร้อน (Summer)', accent: 'bg-orange-500' };
      case 'rainy': return { bg: 'bg-teal-50', header: 'border-teal-200', text: 'หน้าฝน (Rainy)', accent: 'bg-teal-500' };
      case 'winter': return { bg: 'bg-blue-50', header: 'border-blue-200', text: 'หน้าหนาว (Winter)', accent: 'bg-blue-500' };
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
    setScanResult(null);

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
        setScanResult({ status: 'error', message: `ไม่พบเกมหรือรหัส "${scannedText}" ในระบบ` });
        setIsProcessingScan(false);
        setTimeout(() => setScanResult(null), 4000);
        return;
      }

      const result = await fetchBorrowedItems();
      if (result.success && result.data) {
        const borrowedMatch = result.data.find((item: any) => 
          item.gameName.toLowerCase() === foundGame!.name.toLowerCase()
        );

        if (borrowedMatch) {
          const returnRes = await recordReturn(borrowedMatch.studentId, borrowedMatch.gameName);
          if (returnRes.success) {
            setScanResult({
              status: 'success',
              message: `คืนสำเร็จ: ${borrowedMatch.gameName}\n(สแกนด้วยรหัส: ${scannedText})`
            });
            setRefreshKey(prev => prev + 1);
          } else {
            setScanResult({ status: 'error', message: returnRes.message || 'คืนไม่สำเร็จ' });
          }
        } else {
          setScanResult({ status: 'error', message: `เกม "${foundGame.name}" ไม่ได้ถูกยืมอยู่` });
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

  const handleAddGame = (newGameData: any) => {
    const newGame: BoardGame = {
      ...newGameData,
      id: boardGames.length > 0 ? Math.max(...boardGames.map(g => g.id)) + 1 : 1,
      selected: false,
    };
    setBoardGames(prevGames => [...prevGames, newGame]);
  };

  const handleUpdateGame = (updatedGame: BoardGame) => {
    setBoardGames(prevGames => prevGames.map(game => (game.id === updatedGame.id ? updatedGame : game)));
  };

  const handleDeleteGames = (ids: number[]) => {
    setBoardGames(prevGames => prevGames.filter(game => !ids.includes(game.id)));
  };

  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลบอร์ดเกมทั้งหมด?')) {
      setBoardGames(INITIAL_BOARD_GAMES);
      localStorage.removeItem('boardGames');
    }
  };

  const handleBackToList = () => setView(View.List);
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const renderContent = () => {
    switch (view) {
      case View.Search: return <SearchView boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} onBack={handleBackToList} />;
      case View.ReturnList: return <ReturnHistoryView boardGames={boardGames} onBack={handleBackToList} key={`ret-${refreshKey}`} />;
      case View.TransactionHistory: return <TransactionHistoryView onBack={handleBackToList} key={`his-${refreshKey}`} />;
      case View.BorrowForm: return <BorrowForm selectedGames={selectedGames} onSuccess={handleBorrowSuccess} onBack={handleBackToList} />;
      case View.ManageGames: return <ManageGamesView boardGames={boardGames} onAddGame={handleAddGame} onUpdateGame={handleUpdateGame} onDeleteGames={handleDeleteGames} onResetData={handleResetData} onBack={handleBackToList} />;
      case View.BorrowSuccess: return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white/90 backdrop-blur shadow-2xl rounded-[40px] max-w-lg mx-auto mt-20 animate-scale-in border-t-8 border-green-500 z-10 relative">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8"><svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
          <h2 className="text-4xl font-black text-slate-800 mb-3">ยืมสำเร็จ!</h2>
          <button onClick={handleBackToList} className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl hover:bg-blue-700 transition shadow-xl">กลับหน้าหลัก</button>
        </div>
      );
      default: return <BoardGameList boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} />;
    }
  };

  return (
    <div className={`${themeConfig?.bg} min-h-screen font-sans text-slate-800 pb-20 transition-all duration-1000 relative`}>
      <SeasonalEffect season={currentSeason} />
      
      <Header 
        onReturnClick={() => setView(View.ReturnList)} 
        onManageClick={() => setIsPasswordModalOpen(true)} 
        onSearchClick={() => setView(View.Search)} 
        onHistoryClick={() => setView(View.TransactionHistory)}
        season={currentSeason}
      />
      
      <main className="container mx-auto px-4 py-8 overflow-hidden relative z-10">
        <div className="flex justify-center mb-4">
          <div className="bg-white/50 backdrop-blur px-5 py-2 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm border border-white/50 flex items-center gap-3">
             <span className={`w-2 h-2 rounded-full ${themeConfig.accent} animate-pulse`}></span>
             {themeConfig?.text}
          </div>
        </div>
        {renderContent()}
      </main>

      {/* Floating Selection Bar - Moved here to prevent it from disappearing */}
      {(view === View.List || view === View.Search) && selectedGames.length > 0 && (
        <footer className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-3xl z-[200] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between px-8 animate-scale-in">
          <div className="flex flex-col">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Selected Games</span>
            <span className="text-white font-black text-lg">{selectedGames.length} รายการ</span>
          </div>
          <button
            onClick={handleConfirmSelection}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95 flex items-center gap-3"
          >
            <span>ยืนยันรายการ</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </footer>
      )}

      {/* Season Switcher Dock */}
      <div className="fixed bottom-6 right-6 z-[150] flex flex-col gap-3 group">
          <div className="flex flex-col gap-3 scale-0 group-hover:scale-100 transition-all duration-300 origin-bottom">
            <button 
                onClick={() => setCurrentSeason('summer')}
                title="หน้าร้อน"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${currentSeason === 'summer' ? 'bg-orange-500 text-white scale-110' : 'bg-white text-orange-500 hover:bg-orange-50'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
            </button>
            <button 
                onClick={() => setCurrentSeason('rainy')}
                title="หน้าฝน"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${currentSeason === 'rainy' ? 'bg-teal-500 text-white scale-110' : 'bg-white text-teal-500 hover:bg-teal-50'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
            </button>
            <button 
                onClick={() => setCurrentSeason('winter')}
                title="หน้าหนาว"
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${currentSeason === 'winter' ? 'bg-blue-500 text-white scale-110' : 'bg-white text-blue-500 hover:bg-blue-50'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m0 0V4.5m0 15V21"></path></svg>
            </button>
          </div>
          <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl border border-slate-100 text-slate-400 group-hover:rotate-45 transition-transform duration-300">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>
      </div>
      
      {isConfirmationModalOpen && <ConfirmationModal selectedGames={selectedGames} onClose={() => setConfirmationModalOpen(false)} onConfirm={handleProceedToBorrow} />}
      
      {isPasswordModalOpen && (
        <PasswordModal 
          onClose={() => setIsPasswordModalOpen(false)} 
          onSuccess={() => {
            setIsPasswordModalOpen(false);
            setView(View.ManageGames);
          }} 
        />
      )}

      {isProcessingScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-[32px] p-10 flex flex-col items-center shadow-2xl animate-scale-in">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-800 font-black text-xl">กำลังประมวลผลด้วยรหัสสแกน...</p>
          </div>
        </div>
      )}
      
      {scanResult && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1001] w-[90%] max-w-md animate-bounce-short">
          <div className={`${scanResult.status === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-8 py-6 rounded-3xl shadow-2xl border-4 border-white/20 flex flex-col items-center text-center`}>
            <p className="font-black text-xl whitespace-pre-line">{scanResult.message}</p>
            <button onClick={() => setScanResult(null)} className="mt-4 underline text-sm font-bold opacity-80">ปิด</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-short { 
          0%, 100% {transform: translateY(0) translateX(-50%);} 
          50% {transform: translateY(-10px) translateX(-50%);} 
        }
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up { 
          animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-bounce-short { animation: bounce-short 0.6s ease-in-out; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-fade-in { animation: opacity-in 0.5s ease forwards; }
        @keyframes opacity-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default App;
