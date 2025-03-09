import React from 'react';
import { Button } from './button';
import { List, GitGraph } from 'lucide-react';
import { ViewMode } from '@/types/ViewMode';

interface PathToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function PathToggle({ viewMode, onChange }: PathToggleProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        className="rounded-r-none"
        onClick={() => onChange('list')}
      >
        <List className="h-4 w-4 mr-2" />
        List View
      </Button>
      <Button
        variant={viewMode === 'path' ? 'default' : 'outline'}
        size="sm"
        className="rounded-l-none"
        onClick={() => onChange('path')}
      >
        <GitGraph className="h-4 w-4 mr-2" />
        Path View
      </Button>
    </div>
  );
} 