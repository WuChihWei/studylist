import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ViewMode } from '@/types/ViewMode';
import { List, GitBranch } from 'lucide-react';

interface SidebarToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function SidebarToggle({ viewMode, onChange }: SidebarToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams?.get('topic');
  
  const handleModeChange = (mode: ViewMode) => {
    onChange(mode);
    router.push(`/database?mode=${mode}`);
  };
  
  return (
    <div className="flex p-1 bg-gray-100 rounded-lg">
      <button
        className={`
          flex-1 flex items-center justify-center py-1.5 px-3 text-xs font-medium rounded transition-all
          ${viewMode === 'list' 
            ? 'bg-white text-gray-800 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}
        `}
        onClick={() => handleModeChange('list')}
      >
        <List size={14} className={`mr-1.5 ${viewMode === 'list' ? 'text-blue-600' : 'text-gray-500'}`} />
        List
      </button>
      
      <button
        className={`
          flex-1 flex items-center justify-center py-1.5 px-3 text-xs font-medium rounded transition-all
          ${viewMode === 'path' 
            ? 'bg-white text-gray-800 shadow-sm' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}
        `}
        onClick={() => handleModeChange('path')}
      >
        <GitBranch size={14} className={`mr-1.5 ${viewMode === 'path' ? 'text-blue-600' : 'text-gray-500'}`} />
        Path
      </button>
    </div>
  );
} 