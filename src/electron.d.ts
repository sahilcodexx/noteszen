export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string; // 'all' | 'work' | 'personal' | 'ideas' | 'trash' | etc.
  tags: string[];
  isPinned: boolean;
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
