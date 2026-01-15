
import React from 'react';

interface HeaderProps {
  onReturnClick: () => void;
  onManageClick: () => void;
  onSearchClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReturnClick, onManageClick, onSearchClick }) => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
        {/* Logo/Title */}
        <div className="flex items-center overflow-hidden">
          <h1 className="text-xl md:text-2xl font-bold text-blue-700 truncate">ระบบยืม-คืนบอร์ดเกม</h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
          {/* Search Bar Trigger (Desktop) - Google Style */}
          <div 
            onClick={onSearchClick}
            className="hidden md:flex items-center bg-gray-100 border border-transparent hover:border-gray-200 text-gray-500 px-4 py-2 rounded-full w-48 lg:w-64 cursor-pointer hover:shadow-md hover:bg-white transition-all duration-300 group mr-2"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span className="text-sm select-none">ค้นหาบอร์ดเกม</span>
          </div>

          {/* Search Button (Mobile) - Circle Style */}
          <button
            onClick={onSearchClick}
            className="md:hidden bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition duration-300 focus:outline-none"
            aria-label="ค้นหา"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>

          {/* Return Button */}
          <button
            onClick={onReturnClick}
            className="bg-green-600 text-white font-semibold py-2 px-3 md:px-5 rounded-lg hover:bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center text-sm md:text-base whitespace-nowrap shadow-sm"
          >
            <svg className="w-5 h-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2z"></path></svg>
            <span className="hidden md:inline">คืนบอร์ดเกม</span>
            <span className="md:hidden">คืน</span>
          </button>

          {/* Manage Button */}
          <button
            onClick={onManageClick}
            className="bg-gray-700 text-white font-semibold py-2 px-3 md:px-5 rounded-lg hover:bg-gray-800 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center text-sm md:text-base whitespace-nowrap shadow-sm"
          >
            <svg className="w-5 h-5 md:mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.48.398.668 1.03.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden md:inline">จัดการบอร์ดเกม</span>
            <span className="md:hidden">จัดการบอร์ดเกม</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
