
export interface BoardGame {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  selected: boolean;
  category: string;
  isPopular: boolean;
}

export enum View {
  List = 'LIST',
  BorrowForm = 'BORROW_FORM',
  BorrowSuccess = 'BORROW_SUCCESS',
  ManageGames = 'MANAGE_GAMES',
  Search = 'SEARCH',
}

export interface BorrowerInfo {
  studentId: string;
  classroom: string;
  numberOfPlayers: string;
  major: string;
  games: string[];
}
