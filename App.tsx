
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

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.List);
  const [refreshKey, setRefreshKey] = useState(0); // สำหรับบังคับ Refresh ข้อมูลในหน้าลูก
  const [boardGames, setBoardGames] = useState<BoardGame[]>(() => {
    try {
      const savedGames = localStorage.getItem('boardGames');
      if (savedGames) {
        const parsed: any[] = JSON.parse(savedGames);
        return parsed.map(game => ({
          ...game,
          category: game.category || 'เกมวางกลยุทธ์',
          isPopular: game.isPopular ?? false,
        }));
      }
      return INITIAL_BOARD_GAMES;
    } catch (error) {
      console.error('Error loading board games from localStorage:', error);
      return INITIAL_BOARD_GAMES;
    }
  });

  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
  
  // State สำหรับการจัดการสแกนอัตโนมัติ
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error', message: string} | null>(null);
  const scanBuffer = useRef('');

  useEffect(() => {
    localStorage.setItem('boardGames', JSON.stringify(boardGames));
  }, [boardGames]);

  // ระบบดักจับการสแกน Global (Auto-Return)
  useEffect(() => {
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // ถ้ากำลังพิมพ์อยู่ในช่อง Input หรือ Textarea ให้ข้ามไป (เพื่อให้ใช้ Search ได้ปกติ)
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        const scannedText = scanBuffer.current.trim();
        if (scannedText) {
          processGlobalScan(scannedText);
        }
        scanBuffer.current = '';
      } else {
        if (e.key.length === 1) {
          scanBuffer.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [boardGames, view]);

  const processGlobalScan = async (gameName: string) => {
    // 1. ค้นหาเกมในฐานข้อมูลท้องถิ่นก่อน
    const foundGame = boardGames.find(g => g.name.toLowerCase() === gameName.toLowerCase());
    if (!foundGame) {
      setScanResult({ status: 'error', message: `ไม่พบเกมชื่อ "${gameName}" ในระบบ` });
      setTimeout(() => setScanResult(null), 4000);
      return;
    }

    setIsProcessingScan(true);
    setScanResult(null);

    try {
      // 2. ตรวจสอบว่าใครยืมเกมนี้อยู่จาก Google Sheet
      const result = await fetchBorrowedItems();
      if (result.success && result.data) {
        const borrowedMatch = result.data.find((item: any) => 
          item.gameName.toLowerCase() === gameName.toLowerCase()
        );

        if (borrowedMatch) {
          // 3. ทำการคืนอัตโนมัติทันทีโดยใช้ Student ID จากข้อมูลการยืม
          const returnRes = await recordReturn(borrowedMatch.studentId, borrowedMatch.gameName);
          if (returnRes.success) {
            setScanResult({
              status: 'success',
              message: `คืนสำเร็จ: ${borrowedMatch.gameName} (รหัสผู้ยืม: ${borrowedMatch.studentId})`
            });
            // หากอยู่ที่หน้า ReturnList หรือ History ให้บังคับรีเฟรชข้อมูล
            setRefreshKey(prev => prev + 1);
          } else {
            setScanResult({ status: 'error', message: returnRes.message || 'ไม่สามารถทำรายการคืนได้' });
          }
        } else {
          setScanResult({ status: 'error', message: `เกม "${foundGame.name}" พร้อมให้ยืม (ไม่มีผู้ยืมค้างอยู่)` });
        }
      }
    } catch (err) {
      setScanResult({ status: 'error', message: 'การเชื่อมต่อขัดข้อง กรุณาลองใหม่อีกครั้ง' });
    } finally {
      setIsProcessingScan(false);
      // ซ่อนข้อความแจ้งเตือนอัตโนมัติ
      setTimeout(() => setScanResult(null), 5000);
    }
  };

  const selectedGames = useMemo(() => boardGames.filter(game => game.selected), [boardGames]);

  const handleToggleSelect = (id: number) => {
    setBoardGames(prevGames =>
      prevGames.map(game =>
        game.id === id ? { ...game, selected: !game.selected } : game
      )
    );
  };

  const handleConfirmSelection = () => {
    if (selectedGames.length > 0) {
      setConfirmationModalOpen(true);
    } else {
      alert('กรุณาเลือกบอร์ดเกมอย่างน้อย 1 รายการ');
    }
  };

  const handleProceedToBorrow = () => {
    setConfirmationModalOpen(false);
    setView(View.BorrowForm);
  };

  const handleBorrowSuccess = () => {
    setView(View.BorrowSuccess);
    setBoardGames(prevGames =>
      prevGames.map(game => ({ ...game, selected: false }))
    );
  };
  
  const handleAddGame = (newGameData: { name: string; description: string; imageUrl: string; category: string; isPopular: boolean }) => {
    const newGame: BoardGame = {
      ...newGameData,
      id: boardGames.length > 0 ? Math.max(...boardGames.map(g => g.id)) + 1 : 1,
      selected: false,
    };
    setBoardGames(prevGames => [...prevGames, newGame]);
  };

  const handleUpdateGame = (updatedGame: BoardGame) => {
    setBoardGames(prevGames =>
      prevGames.map(game => (game.id === updatedGame.id ? updatedGame : game))
    );
  };

  const handleDeleteGames = (ids: number[]) => {
    setBoardGames(prevGames => prevGames.filter(game => !ids.includes(game.id)));
  };

  const handleResetData = () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลบอร์ดเกมทั้งหมดให้กลับเป็นค่าเริ่มต้น?')) {
      setBoardGames(INITIAL_BOARD_GAMES);
      localStorage.removeItem('boardGames');
    }
  };

  const handleBackToList = () => {
    setView(View.List);
  };

  const renderContent = () => {
    switch (view) {
      case View.Search:
        return (
          <SearchView
            boardGames={boardGames}
            onToggleSelect={handleToggleSelect}
            onConfirm={handleConfirmSelection}
            selectedCount={selectedGames.length}
            onBack={handleBackToList}
          />
        );
      case View.ReturnList:
        return <ReturnHistoryView boardGames={boardGames} onBack={handleBackToList} key={`return-${refreshKey}`} />;
      case View.TransactionHistory:
        return <TransactionHistoryView onBack={handleBackToList} key={`history-${refreshKey}`} />;
      case View.BorrowForm:
        return <BorrowForm selectedGames={selectedGames} onSuccess={handleBorrowSuccess} onBack={handleBackToList} />;
      case View.BorrowSuccess:
        return (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-white shadow-2xl rounded-[40px] max-w-lg mx-auto mt-20 animate-scale-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-3">สำเร็จ!</h2>
            <p className="text-slate-500 mb-10 text-lg">ข้อมูลการยืมของท่านถูกบันทึกลงในระบบแล้ว</p>
            <button
              onClick={handleBackToList}
              className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl hover:bg-blue-700 transition duration-300 shadow-xl shadow-blue-500/20 transform hover:-translate-y-1"
            >
              กลับไปหน้าหลัก
            </button>
          </div>
        );
      case View.ManageGames:
        return (
          <ManageGamesView 
            boardGames={boardGames} 
            onAddGame={handleAddGame} 
            onUpdateGame={handleUpdateGame}
            onDeleteGames={handleDeleteGames}
            onResetData={handleResetData}
            onBack={handleBackToList} 
          />
        );
      case View.List:
      default:
        return (
          <BoardGameList
            boardGames={boardGames}
            onToggleSelect={handleToggleSelect}
            onConfirm={handleConfirmSelection}
            selectedCount={selectedGames.length}
          />
        );
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-800 pb-20">
      <Header 
        onReturnClick={() => setView(View.ReturnList)} 
        onManageClick={() => setView(View.ManageGames)}
        onSearchClick={() => setView(View.Search)}
        onHistoryClick={() => setView(View.TransactionHistory)}
      />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>

      {isConfirmationModalOpen && (
        <ConfirmationModal
          selectedGames={selectedGames}
          onClose={() => setConfirmationModalOpen(false)}
          onConfirm={handleProceedToBorrow}
        />
      )}

      {/* Auto-Return Processing Overlay */}
      {isProcessingScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-10 flex flex-col items-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-800 font-black text-xl">กำลังประมวลผลการคืน...</p>
            <p className="text-slate-500 text-sm mt-2">กรุณารอสักครู่ ระบบกำลังสื่อสารกับฐานข้อมูล</p>
          </div>
        </div>
      )}

      {/* Auto-Return Result Toast */}
      {scanResult && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1001] w-[90%] max-w-md animate-bounce-short">
          <div className={`${scanResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-8 py-5 rounded-3xl shadow-2xl border-4 border-white/20 flex flex-col items-center text-center`}>
            <div className="mb-2">
              {scanResult.status === 'success' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              )}
            </div>
            <p className="font-black text-lg leading-tight">{scanResult.message}</p>
            <button onClick={() => setScanResult(null)} className="mt-4 text-white/70 hover:text-white font-bold text-xs uppercase tracking-widest underline">ปิด</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-short {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0) translateX(-50%);}
          40% {transform: translateY(-10px) translateX(-50%);}
          60% {transform: translateY(-5px) translateX(-50%);}
        }
        .animate-bounce-short {
          animation: bounce-short 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
