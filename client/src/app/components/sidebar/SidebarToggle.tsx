import React from 'react';
import { ViewMode } from '@/types/ViewMode';
import { List, GitGraph } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SidebarToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function SidebarToggle({ viewMode, onChange }: SidebarToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTopicId = searchParams?.get('topic');
  
  const handleModeChange = (mode: ViewMode) => {
    onChange(mode);
    
    // Update URL if we're on a topic page
    if (currentTopicId) {
      router.push(`/database?topic=${currentTopicId}&mode=${mode}`);
    }
  };
  
  return (
    <div className="flex rounded-md bg-gray-100 p-1">
      <button
        type="button"
        className={`flex-1 flex items-center justify-center py-1 px-2 text-xs font-medium rounded ${
          viewMode === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
        }`}
        onClick={() => handleModeChange('list')}
      >
        <List className="h-3.5 w-3.5 mr-1" />
        <span>List</span>
      </button>
      <button
        type="button"
        className={`flex-1 flex items-center justify-center py-1 px-2 text-xs font-medium rounded ${
          viewMode === 'path'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-700 hover:text-gray-900'
        }`}
        onClick={() => handleModeChange('path')}
      >
        <GitGraph className="h-3.5 w-3.5 mr-1" />
        <span>Path</span>
      </button>
    </div>
  );
} 