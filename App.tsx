
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
      // 1. ค้นหาด้วยรหัส Barcode ก่อน (ลำดับความสำคัญสูงสุด)
      let foundGame = boardGames.find(g => g.barcode === scannedText);

      // 2. ถ้าไม่เจอ Barcode ให้ค้นหาด้วยชื่อ (Smart Search)
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
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white shadow-2xl rounded-[40px] max-w-lg mx-auto mt-20 animate-scale-in border-t-8 border-green-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8"><svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
          <h2 className="text-4xl font-black text-slate-800 mb-3">ยืมสำเร็จ!</h2>
          <button onClick={handleBackToList} className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl hover:bg-blue-700 transition shadow-xl">กลับหน้าหลัก</button>
        </div>
      );
      default: return <BoardGameList boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} />;
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-800 pb-20">
      <Header onReturnClick={() => setView(View.ReturnList)} onManageClick={() => setView(View.ManageGames)} onSearchClick={() => setView(View.Search)} onHistoryClick={() => setView(View.TransactionHistory)} />
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>
      {isConfirmationModalOpen && <ConfirmationModal selectedGames={selectedGames} onClose={() => setConfirmationModalOpen(false)} onConfirm={handleProceedToBorrow} />}
      {isProcessingScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-[32px] p-10 flex flex-col items-center shadow-2xl">
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
        @keyframes bounce-short { 0%, 100% {transform: translateY(0) translateX(-50%);} 50% {transform: translateY(-10px) translateX(-50%);} }
        .animate-bounce-short { animation: bounce-short 0.6s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
