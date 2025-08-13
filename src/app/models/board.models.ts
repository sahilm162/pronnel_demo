export type CellType = 'text' | 'number' | 'url' | 'email' | 'priority' | 'bucket';

export interface BoardColumn {
  key: string;              
  header: string;           
  type: CellType;
  width?: string;          
}

export interface BoardItem {
  [key: string]: any;       
}

export interface Board {
  columns: BoardColumn[];
  items: BoardItem[];
}