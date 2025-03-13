import React, { useState, useRef, useEffect } from 'react';
import { Material } from '@/types/User';
import styles from './UnifiedTableView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaPlay } from "react-icons/fa";
import { BiWorld } from "react-icons/bi";
import { RiEarthFill } from "react-icons/ri";
import { MoreHorizontal, Pencil, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import CircleProgress from './ui/circleProgress';
import { getFavicon, getIconComponent, renderFavicon, TYPE_ICONS, FAVICON_STYLES } from '@/utils/favicon';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import DraggableList, { DraggableListHandle } from './DraggableList';
import Image from 'next/image';
import { ListSubMode } from '@/types/ViewMode';

// Component props interface
interface UnifiedTableViewProps {
  materials: (Material & { index: number })[];
  viewType: 'materials';
  viewMode: ListSubMode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string, isCompleted: boolean) => void;
  onUpdateProgress: (id: string, completed: number, total: number) => void;
  unitMinutes?: number;
  onReorderItems?: (items: Material[]) => void;
  onUnitMinutesChange?: (minutes: number) => void;
}

export default function UnifiedTableView({
  materials,
  viewType,
  viewMode,
  onEdit,
  onDelete,
  onComplete,
  onUpdateProgress,
  unitMinutes = 20,
  onReorderItems,
  onUnitMinutesChange
}: UnifiedTableViewProps) {
  
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [draggableListKey, setDraggableListKey] = useState<string>('list-0');
  const draggableListRef = useRef<DraggableListHandle>(null);
  const [reorderCount, setReorderCount] = useState(0);
  const [localMaterials, setLocalMaterials] = useState(materials);
  const [forceRender, setForceRender] = useState(0);

  // 使用 ref 來追踪最新的 materials
  const materialsRef = useRef(materials);

  // ===== EFFECTS =====
  
  // Handle materials changes
  useEffect(() => {
    setLocalMaterials(materials);
    materialsRef.current = materials;
    
    // Reset the draggableListKey when materials change to force a complete re-render
    setDraggableListKey(`draggable-list-${Date.now()}`);
  }, [materials]);

  // Handle reorder count updates
  useEffect(() => {
    if (reorderCount > 0) {
      setForceRender(prev => prev + 1);
    }
  }, [reorderCount]);

  // Handle forced render - consider removing if empty
  useEffect(() => {
    if (forceRender > 0) {
    }
  }, [forceRender]);

  // ===== HELPER FUNCTIONS =====

  // Estimate time units based on material type
  const estimateTimeUnits = (material: Material) => {
    if (material.readingTime) {
      return Math.ceil(material.readingTime / unitMinutes);
    }
    
    // Default units based on content type if not specified
    switch (material.type) {
      case 'video': return 6;
      case 'podcast': return 8;
      case 'book': return 12;
      case 'webpage': return 3;
      default: return 4;
    }
  };

  // ===== EVENT HANDLERS =====

  // Handle unit completion
  const handleUnitComplete = async (material: Material, clickedIndex: number) => {
    if (!material._id || !onUpdateProgress) return;
    
    const totalUnits = estimateTimeUnits(material);
    const currentCompleted = material.completedUnits || 0;
    
    // If clicking on a completed unit, mark it and all after it as incomplete
    if (clickedIndex < currentCompleted) {
      onUpdateProgress(material._id, clickedIndex, totalUnits);
    } 
    // If clicking on the last uncompleted unit, mark all as complete
    else if (clickedIndex === totalUnits - 1) {
      onUpdateProgress(material._id, totalUnits, totalUnits);
    } 
    // Otherwise mark up to the clicked unit as complete
    else {
      onUpdateProgress(material._id, clickedIndex + 1, totalUnits);
    }
  };

  // Handle restore of original order
  const handleRestoreOriginalOrder = () => {
    if (draggableListRef.current) {
      draggableListRef.current.restoreOriginalOrder();
      setReorderCount(prev => prev + 1);
      setDraggableListKey(`list-${reorderCount + 1}`);
    } else {
      const topicId = localStorage.getItem('activeTopicId');
      if (!topicId) {
        return;
      }
      
      try {
        const savedOrder = localStorage.getItem(`original_order_${topicId}`);
        if (!savedOrder) {
          alert('找不到原始順序資料');
          return;
        }
        
        const orderMap = new Map(JSON.parse(savedOrder));
        
        // Sort materials based on original order
        const sortedMaterials = [...localMaterials].sort((a, b) => {
          const orderA = a._id ? (orderMap.get(a._id) ?? 0) : 0;
          const orderB = b._id ? (orderMap.get(b._id) ?? 0) : 0;
          return Number(orderA) - Number(orderB);
        });
        
        // Update indexes
        const materialsWithUpdatedIndexes = sortedMaterials.map((item, index) => ({
          ...item,
          index: index + 1
        }));
        
        setLocalMaterials(materialsWithUpdatedIndexes);
        
        if (onReorderItems) {
          onReorderItems(materialsWithUpdatedIndexes);
          setReorderCount(prev => prev + 1);
          setDraggableListKey(`list-${reorderCount + 1}`);
        }
      } catch (error) {
        alert('恢復原始順序失敗');
      }
    }
  };

  // Handle reordering with refresh
  const handleReorderWithRefresh = (reorderedItems: (Material & { index: number })[]) => {
    // 確保所有項目都有正確的 order 屬性
    const itemsWithOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    // 立即更新本地狀態
    setLocalMaterials(itemsWithOrder);
    materialsRef.current = itemsWithOrder;
    
    if (onReorderItems) {
      onReorderItems(itemsWithOrder);
      
      // 增加計數器，強制UI刷新
      setReorderCount(prev => prev + 1);
      
      // 更新 key 來強制重新渲染
      setDraggableListKey(`list-${reorderCount + 1}`);
      
      // 延遲更新以確保狀態同步
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 100);
    }
  };

  // ===== REUSABLE UI COMPONENTS =====

  // Render material actions dropdown menu
  const renderActionsDropdown = (material: Material) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem onSelect={() => onEdit(material._id || '')}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem onSelect={() => onDelete(material._id || '')}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render material title with link
  const renderMaterialTitle = (material: Material) => {
    return (
      <div className="font-medium text-gray-800 hover:text-blue-600 truncate max-w-full cursor-pointer"
           onClick={() => material.url && window.open(material.url, '_blank')}>
        <span className="inline-block truncate max-w-[100%]" title={material.title}>
          {material.title}
        </span>
        {material.url && (
          <span className="inline-block ml-1 text-blue-500 ">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </span>
        )}
      </div>
    );
  };

  // Render type icon
  const renderTypeIcon = (material: Material) => (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600">
      {TYPE_ICONS[material.type] && React.createElement(TYPE_ICONS[material.type], { className: "h-4 w-4" })}
    </div>
  );

  // ===== MAIN RENDER =====
  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Add favicon styles */}
      <style dangerouslySetInnerHTML={{ __html: FAVICON_STYLES.fallbackIcon }} />
      <style dangerouslySetInnerHTML={{ __html: FAVICON_STYLES.showFallback }} />
      
      {/* Show a message if no materials */}
      {localMaterials.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No materials found. Add some materials to your list.
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-sm py-2  border-b">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-9">Name</div>
        <div className="col-span-1 flex justify-center">Type</div>
        <div className="col-span-1 flex justify-center">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        <DraggableList
          key={`${viewType}-${draggableListKey}`}
          ref={draggableListRef}
          items={localMaterials}
          onReorder={handleReorderWithRefresh}
          droppableId={`${viewType}-list`}
          renderItem={(material, index) => (
            <div key={material._id} className="grid grid-cols-12 py-3 items-center hover:bg-gray-50">
          
              {/* Number */}
              <div className="col-span-1 text-gray-700 text-center">{material.index}</div>
              
              {/* Name with Favicon */}
              <div className="col-span-9">
                <div className="flex items-center">
                  {renderFavicon(material)}
                  {renderMaterialTitle(material)}
                </div>
              </div>
              
              {/* Type Icon */}
              <div className="col-span-1 flex justify-center">
                {renderTypeIcon(material)}
              </div>
              
              {/* Actions */}
              <div className="col-span-1 flex gap-2 justify-center">
                {renderActionsDropdown(material)}
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}