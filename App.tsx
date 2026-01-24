
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

// ฟังก์ชันแปลงตัวอักษรไทย (Layout Kedmanee) กลับเป็นอังกฤษ
const translateThaiToEng = (text: string) => {
  const thaiMap: { [key: string]: string } = {
    'ฟ': 'a', 'ห': 's', 'ก': 'd', 'ด': 'f', 'เ': 'g', '้': 'h', '่': 'j', 'า': 'k', 'ส': 'l', 'ว': ';', 'ง': "'",
    'ผ': 'z', 'ป': 'x', 'แ': 'c', 'อ': 'v', 'ิ': 'b', 'ื': 'n', 'ท': 'm', 'ม': ',', 'ใ': '.', 'ฝ': '/',
    'ๆ': 'q', 'ไ': 'w', 'ำ': 'e', 'พ': 'r', 'ะ': 't', 'ั': 'y', 'ี': 'u', 'ร': 'i', 'น': 'o', 'ย': 'p', 'บ': '[', 'ล': ']', 'ฃ': '\\',
    'ฟฟ': 'A', 'หห': 'S', 'กก': 'D', 'ดด': 'F', 'เเ': 'G', '้้': 'H', '่่': 'J', 'าา': 'K', 'สส': 'L',
    'ข': 'd', 'ช': 'g' // กรณีทั่วไปที่มักสแกนผิด
  };
  // เพิ่มเติม mapping สำหรับตัวที่เจอใน Catan (ขยัดฟสส)
  const mapping: any = {
    'แ': 'c', 'ข': 'c', 'ย': 'a', 'ั': 'y', 'ด': 't', 'ฟ': 'a', 'น': 'o', 'ส': 'n'
  };
  
  return text.split('').map(char => mapping[char] || char).join('');
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.List);
  const [refreshKey, setRefreshKey] = useState(0);
  const [boardGames, setBoardGames] = useState<BoardGame[]>(() => {
    try {
      const savedGames = localStorage.getItem('boardGames');
      if (savedGames) {
        return JSON.parse(savedGames);
      }
      return INITIAL_BOARD_GAMES;
    } catch (error) {
      return INITIAL_BOARD_GAMES;
    }
  });

  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanResult, setScanResult] = useState<{status: 'success' | 'error', message: string} | null>(null);
  const scanBuffer = useRef('');

  // ระบบดักจับการสแกน Global
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        const text = scanBuffer.current.trim();
        if (text) {
          processAutoReturn(text);
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

  const processAutoReturn = async (scannedText: string) => {
    setIsProcessingScan(true);
    setScanResult(null);

    try {
      // 1. ลองค้นหาด้วยชื่อตรงๆ
      let gameName = scannedText;
      let foundGame = boardGames.find(g => g.name.toLowerCase() === gameName.toLowerCase());

      // 2. ถ้าไม่เจอ และดูเหมือนจะเป็นภาษาไทย ให้ลองแปลงเป็นอังกฤษ
      if (!foundGame) {
        const translated = translateThaiToEng(gameName);
        console.log(`Translating ${gameName} to ${translated}`);
        foundGame = boardGames.find(g => g.name.toLowerCase() === translated.toLowerCase());
        if (foundGame) gameName = foundGame.name;
      }

      if (!foundGame) {
        setScanResult({ status: 'error', message: `ไม่พบเกมชื่อ "${scannedText}" ในระบบ` });
        setIsProcessingScan(false);
        setTimeout(() => setScanResult(null), 4000);
        return;
      }

      // 3. ตรวจสอบรายการยืมใน Google Sheet
      const result = await fetchBorrowedItems();
      if (result.success && result.data) {
        const borrowedMatch = result.data.find((item: any) => 
          item.gameName.toLowerCase() === foundGame!.name.toLowerCase()
        );

        if (borrowedMatch) {
          // 4. คืนอัตโนมัติทันที
          const returnRes = await recordReturn(borrowedMatch.studentId, borrowedMatch.gameName);
          if (returnRes.success) {
            setScanResult({
              status: 'success',
              message: `คืนเกม "${borrowedMatch.gameName}" สำเร็จแล้ว! (รหัสผู้ยืม: ${borrowedMatch.studentId})`
            });
            setRefreshKey(prev => prev + 1);
          } else {
            setScanResult({ status: 'error', message: returnRes.message || 'เกิดข้อผิดพลาดในการคืน' });
          }
        } else {
          setScanResult({ status: 'error', message: `เกม "${foundGame.name}" ไม่ได้ถูกยืมอยู่ในขณะนี้` });
        }
      }
    } catch (err) {
      setScanResult({ status: 'error', message: 'การเชื่อมต่อขัดข้อง' });
    } finally {
      setIsProcessingScan(false);
      setTimeout(() => setScanResult(null), 5000);
    }
  };

  // ... (โค้ดส่วนอื่นๆ คงเดิม)
  const selectedGames = useMemo(() => boardGames.filter(game => game.selected), [boardGames]);
  const handleToggleSelect = (id: number) => {
    setBoardGames(prevGames => prevGames.map(game => game.id === id ? { ...game, selected: !game.selected } : game));
  };
  const handleConfirmSelection = () => {
    if (selectedGames.length > 0) setConfirmationModalOpen(true);
    else alert('กรุณาเลือกบอร์ดเกมอย่างน้อย 1 รายการ');
  };
  const handleProceedToBorrow = () => { setView(View.BorrowForm); setConfirmationModalOpen(false); };
  const handleBorrowSuccess = () => {
    setView(View.BorrowSuccess);
    setBoardGames(prevGames => prevGames.map(game => ({ ...game, selected: false })));
  };
  const handleBackToList = () => setView(View.List);

  const renderContent = () => {
    switch (view) {
      case View.Search: return <SearchView boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} onBack={handleBackToList} />;
      case View.ReturnList: return <ReturnHistoryView boardGames={boardGames} onBack={handleBackToList} key={`return-${refreshKey}`} />;
      case View.TransactionHistory: return <TransactionHistoryView onBack={handleBackToList} key={`history-${refreshKey}`} />;
      case View.BorrowForm: return <BorrowForm selectedGames={selectedGames} onSuccess={handleBorrowSuccess} onBack={handleBackToList} />;
      case View.BorrowSuccess: return (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white shadow-2xl rounded-[40px] max-w-lg mx-auto mt-20 animate-scale-in">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8"><svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
          <h2 className="text-4xl font-black text-slate-800 mb-3">สำเร็จ!</h2>
          <p className="text-slate-500 mb-10 text-lg">ข้อมูลการยืมถูกบันทึกเรียบร้อย</p>
          <button onClick={handleBackToList} className="w-full bg-blue-600 text-white font-black py-5 px-8 rounded-2xl">กลับหน้าหลัก</button>
        </div>
      );
      default: return <BoardGameList boardGames={boardGames} onToggleSelect={handleToggleSelect} onConfirm={handleConfirmSelection} selectedCount={selectedGames.length} />;
    }
  };

  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans text-slate-800 pb-20">
      <Header 
        onReturnClick={() => setView(View.ReturnList)} 
        onManageClick={() => setView(View.ManageGames)}
        onSearchClick={() => setView(View.Search)}
        onHistoryClick={() => setView(View.TransactionHistory)}
      />
      <main className="container mx-auto px-4 py-8">{renderContent()}</main>

      {isProcessingScan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="bg-white rounded-[32px] p-10 flex flex-col items-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-800 font-black text-xl">กำลังประมวลผลการคืนอัตโนมัติ...</p>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1001] w-[90%] max-w-md animate-bounce-short">
          <div className={`${scanResult.status === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-8 py-5 rounded-3xl shadow-2xl border-4 border-white/20 flex flex-col items-center text-center`}>
            <p className="font-black text-lg">{scanResult.message}</p>
            <button onClick={() => setScanResult(null)} className="mt-2 underline text-xs font-bold">ปิด</button>
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
