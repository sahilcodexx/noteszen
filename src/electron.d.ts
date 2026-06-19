export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string; // 'personal' | 'work' | 'ideas' | 'trash' etc.
  tags: string[];
  backlinks: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ElectronAPI {
  getNotes: () => Promise<Note[]>;
  saveNote: (note: Note) => Promise<boolean>;
  deleteNote: (noteId: string) => Promise<boolean>;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  closeQuickCapture: () => void;
  log: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
