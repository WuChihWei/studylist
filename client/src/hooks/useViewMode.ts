import { useState, useCallback } from 'react';
import { ViewMode } from '@/types/ViewMode';

export function useViewMode(initialMode: ViewMode = 'list') {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  const toggleViewMode = useCallback(() => {
    setViewMode(prevMode => prevMode === 'list' ? 'path' : 'list');
  }, []);

  return {
    viewMode,
    setViewMode,
    toggleViewMode
  };
} 