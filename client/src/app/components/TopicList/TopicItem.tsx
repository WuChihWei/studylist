import React from 'react';
import { Topic } from '@/types/User';
import { Button } from '@/app/components/ui/button';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface TopicItemProps {
  topic: Topic;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

export default function TopicItem({
  topic,
  isSelected,
  onEdit,
  onDelete,
  onSelect
}: TopicItemProps) {
  // Calculate material counts
  const totalMaterials = topic.materials?.length || 0;
  const completedMaterials = topic.materials?.filter(m => m.completed)?.length || 0;
  const progress = totalMaterials > 0 
    ? Math.round((completedMaterials / totalMaterials) * 100) 
    : 0;

  return (
    <div 
      className={`p-4 rounded-lg border transition-colors cursor-pointer 
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-medium">{topic.name}</h3>
          <div className="text-sm text-gray-500">
            {totalMaterials} {totalMaterials === 1 ? 'material' : 'materials'} · {completedMaterials} completed
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-blue-600">{progress}%</div>
          
          {/* Progress bar */}
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
} 