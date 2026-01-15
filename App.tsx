
import React, { useState, useMemo, useEffect } from 'react';
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

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.List);
  
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
        return <ReturnHistoryView boardGames={boardGames} onBack={handleBackToList} />;
      case View.TransactionHistory:
        return <TransactionHistoryView onBack={handleBackToList} />;
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
    </div>
  );
};

export default App;
