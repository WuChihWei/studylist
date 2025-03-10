export type ViewMode = 'list' | 'path';
export type ListSubMode = 'list' | 'grid';

export interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
} 