
import React, { useState, useMemo, useEffect } from 'react';
import { BoardGame, View } from './types';
import { INITIAL_BOARD_GAMES } from './data/boardGames';
import Header from './components/Header';
import BoardGameList from './components/BoardGameList';
import ConfirmationModal from './components/ConfirmationModal';
import BorrowForm from './components/BorrowForm';
import ReturnModal from './components/ReturnModal';
import ManageGamesView from './components/ManageGamesView';
import SearchView from './components/SearchView';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.List);
  
  // Initialize state from localStorage if available, otherwise use default data
  const [boardGames, setBoardGames] = useState<BoardGame[]>(() => {
    try {
      const savedGames = localStorage.getItem('boardGames');
      if (savedGames) {
        const parsed: any[] = JSON.parse(savedGames);
        // Migration for old data: Add default category and isPopular if missing
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
  const [isReturnModalOpen, setReturnModalOpen] = useState(false);

  // Save to localStorage whenever boardGames changes
  useEffect(() => {
    localStorage.setItem('boardGames', JSON.stringify(boardGames));
  }, [boardGames]);

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
    // Reset selections after borrowing
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
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลบอร์ดเกมทั้งหมดให้กลับเป็นค่าเริ่มต้นตามไฟล์ระบบใช่หรือไม่? ข้อมูลที่คุณเพิ่มเองจะหายไป')) {
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
      case View.BorrowForm:
        return <BorrowForm selectedGames={selectedGames} onSuccess={handleBorrowSuccess} onBack={handleBackToList} />;
      case View.BorrowSuccess:
        return (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white shadow-lg rounded-xl max-w-lg mx-auto mt-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">ยืมบอร์ดเกมสำเร็จ!</h2>
            <p className="text-gray-600 mb-8">ข้อมูลการยืมของท่านถูกบันทึกลงในระบบเรียบร้อยแล้ว</p>
            
            <div className="text-left bg-blue-50 p-6 rounded-lg border border-blue-100 w-full mb-8">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                ขั้นตอนการคืน:
              </h4>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li>1. กลับมาที่หน้าหลักของระบบ</li>
                <li>2. กดปุ่ม <span className="font-bold">"คืนบอร์ดเกม"</span> ที่มุมขวาบน</li>
                <li>3. กรอกรหัสนักศึกษาและเลือกเกมที่ต้องการคืน</li>
              </ul>
            </div>

            <button
              onClick={handleBackToList}
              className="w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
    <div className="bg-slate-50 min-h-screen font-sans text-gray-800 pb-10">
      <Header 
        onReturnClick={() => setReturnModalOpen(true)} 
        onManageClick={() => setView(View.ManageGames)}
        onSearchClick={() => setView(View.Search)}
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

      {isReturnModalOpen && (
        <ReturnModal
          boardGames={boardGames}
          onClose={() => setReturnModalOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
