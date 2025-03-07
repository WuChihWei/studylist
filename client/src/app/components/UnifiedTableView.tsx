import React, { useState, useRef, useEffect } from 'react';
import { Material, Categories } from '@/types/User';
import styles from './UnifiedTableView.module.css';
import { LuGlobe, LuGoal } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaPlay } from "react-icons/fa";
import { MoreHorizontal, Pencil, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import CircleProgress from './ui/circleProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
import DraggableList, { DraggableListHandle } from './DraggableList';
import DragHandle from './DragHandle';

export const TYPE_ICONS = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

interface UnifiedTableViewProps {
  materials: (Material & { type: keyof Categories; index: number })[];
  viewType: 'materials' | 'studylist';
  viewMode?: 'list' | 'grid';
  onEdit?: (material: Material) => void;
  onDelete?: (materialId: string) => Promise<boolean>;
  onComplete?: (materialId: string, isCompleted: boolean) => Promise<void>;
  onUpdateProgress?: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  unitMinutes?: number;
  onReorderItems?: (items: (Material & { type: keyof Categories; index: number })[]) => void;
  onUnitMinutesChange?: (newMinutes: number) => void;
}

export default function UnifiedTableView({
  materials,
  viewType,
  viewMode = 'list',
  onEdit,
  onDelete,
  onComplete,
  onUpdateProgress,
  unitMinutes = 20,
  onReorderItems,
  onUnitMinutesChange
}: UnifiedTableViewProps) {
  
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [draggableListKey, setDraggableListKey] = useState<string>(`draggable-list-${Date.now()}`);
  const draggableListRef = useRef<DraggableListHandle>(null);
  const [reorderCount, setReorderCount] = useState(0);
  const [localMaterials, setLocalMaterials] = useState(materials);
  const [forceRender, setForceRender] = useState(0);

  // 使用 ref 來追踪最新的 materials
  const materialsRef = useRef(materials);

  useEffect(() => {
    console.log('📊 UnifiedTableView - materials 變化', materials.map(m => `${m._id}:${m.index}`));
    setLocalMaterials(materials);
    materialsRef.current = materials;
    
    // Reset the draggableListKey when materials change to force a complete re-render
    setDraggableListKey(`draggable-list-${Date.now()}`);
  }, [materials]);

  useEffect(() => {
    if (reorderCount > 0) {
      console.log('📊 UnifiedTableView - reorderCount 變化', reorderCount);
      // 強制重新渲染
      setForceRender(prev => prev + 1);
    }
  }, [reorderCount]);

  useEffect(() => {
    console.log('📊 UnifiedTableView - draggableListKey 變化', draggableListKey);
  }, [draggableListKey]);

  // 添加一個效果來處理強制渲染
  useEffect(() => {
    if (forceRender > 0) {
      console.log('📊 UnifiedTableView - forceRender 變化，強制重新渲染', forceRender);
    }
  }, [forceRender]);

  const estimateTimeUnits = (material: Material & { type: keyof Categories }) => {
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

  const handleUnitComplete = async (material: Material & { type: keyof Categories }, clickedIndex: number) => {
    if (!material._id || !onUpdateProgress) return;
    
    const totalUnits = estimateTimeUnits(material);
    const currentCompleted = material.completedUnits || 0;
    
    // If clicking on a completed unit, mark it and all after it as incomplete
    if (clickedIndex < currentCompleted) {
      await onUpdateProgress(material._id, {
        completedUnits: clickedIndex,
        completed: false
      });
    } 
    // If clicking on the last uncompleted unit, mark all as complete
    else if (clickedIndex === totalUnits - 1) {
      await onUpdateProgress(material._id, {
        completedUnits: totalUnits,
        completed: true
      });
    } 
    // Otherwise mark up to the clicked unit as complete
    else {
      await onUpdateProgress(material._id, {
        completedUnits: clickedIndex + 1,
        completed: false
      });
    }
  };

  const handleRestoreOriginalOrder = () => {
    console.log('📊 UnifiedTableView - 開始恢復原始順序');
    if (draggableListRef.current) {
      console.log('📊 UnifiedTableView - 使用 draggableListRef 恢復原始順序');
      draggableListRef.current.restoreOriginalOrder();
      setReorderCount(prev => {
        console.log('📊 UnifiedTableView - 增加 reorderCount', prev, prev + 1);
        return prev + 1;
      });
      const newKey = `draggable-list-${Date.now()}`;
      console.log('📊 UnifiedTableView - 更新 draggableListKey', draggableListKey, newKey);
      setDraggableListKey(newKey);
    } else {
      console.log('📊 UnifiedTableView - draggableListRef 不存在，使用備用方法');
      const topicId = localStorage.getItem('activeTopicId');
      if (!topicId) {
        console.log('📊 UnifiedTableView - 找不到 activeTopicId，無法恢復');
        return;
      }
      
      try {
        const savedOrder = localStorage.getItem(`original_order_${topicId}`);
        if (!savedOrder) {
          console.log('📊 UnifiedTableView - 找不到原始順序資料');
          alert('找不到原始順序資料');
          return;
        }
        
        console.log('📊 UnifiedTableView - 從 localStorage 獲取原始順序', savedOrder);
        const orderMap = new Map(JSON.parse(savedOrder));
        
        // Sort materials based on original order
        console.log('📊 UnifiedTableView - 排序前的材料', localMaterials.map(m => `${m._id}:${m.index}`));
        const sortedMaterials = [...localMaterials].sort((a, b) => {
          const orderA = a._id ? (orderMap.get(a._id) ?? 0) : 0;
          const orderB = b._id ? (orderMap.get(b._id) ?? 0) : 0;
          return Number(orderA) - Number(orderB);
        });
        console.log('📊 UnifiedTableView - 排序後的材料', sortedMaterials.map(m => `${m._id}:${m.index}`));
        
        // Update indexes
        const materialsWithUpdatedIndexes = sortedMaterials.map((item, index) => ({
          ...item,
          index: index + 1
        }));
        console.log('📊 UnifiedTableView - 更新索引後的材料', materialsWithUpdatedIndexes.map(m => `${m._id}:${m.index}`));
        
        // 更新本地狀態
        setLocalMaterials(materialsWithUpdatedIndexes);
        
        // Call the parent component's reorder function
        if (onReorderItems) {
          console.log('📊 UnifiedTableView - 調用 onReorderItems');
          onReorderItems(materialsWithUpdatedIndexes);
          
          // Force re-render of the DraggableList component
          const newKey = `draggable-list-${Date.now()}`;
          console.log('📊 UnifiedTableView - 更新 draggableListKey', draggableListKey, newKey);
          setDraggableListKey(newKey);
          
          // 增加計數器，強制UI刷新
          setReorderCount(prev => {
            console.log('📊 UnifiedTableView - 增加 reorderCount', prev, prev + 1);
            return prev + 1;
          });
        } else {
          console.log('📊 UnifiedTableView - onReorderItems 不存在');
        }
      } catch (error) {
        console.error('📊 UnifiedTableView - 恢復原始順序失敗', error);
        alert('恢復原始順序失敗');
      }
    }
  };

  const handleReorderWithRefresh = (reorderedItems: (Material & { type: keyof Categories; index: number })[]) => {
    console.log('📊 UnifiedTableView - handleReorderWithRefresh 開始', reorderedItems.map(m => `${m._id}:${m.index}`));
    
    // 立即更新本地狀態
    setLocalMaterials(reorderedItems);
    materialsRef.current = reorderedItems;
    console.log('📊 UnifiedTableView - 更新本地狀態完成');
    
    if (onReorderItems) {
      console.log('📊 UnifiedTableView - 調用 onReorderItems');
      onReorderItems(reorderedItems);
      
      // 增加計數器，強制UI刷新
      setReorderCount(prev => {
        console.log('📊 UnifiedTableView - 增加 reorderCount', prev, prev + 1);
        return prev + 1;
      });
      
      // 更新DraggableList的key，強制其重新渲染
      const newKey = `draggable-list-${Date.now()}`;
      console.log('📊 UnifiedTableView - 更新 draggableListKey', draggableListKey, newKey);
      setDraggableListKey(newKey);
      
      // 延遲 100ms 後再次強制刷新
      setTimeout(() => {
        console.log('📊 UnifiedTableView - 延遲強制刷新');
        setForceRender(prev => prev + 1);
        
        // 再次更新DraggableList的key，確保其重新渲染
        const newerKey = `draggable-list-${Date.now()}`;
        console.log('📊 UnifiedTableView - 再次更新 draggableListKey', draggableListKey, newerKey);
        setDraggableListKey(newerKey);
      }, 100);
      
      // 延遲 200ms 後第二次強制刷新
      setTimeout(() => {
        console.log('📊 UnifiedTableView - 第二次延遲強制刷新');
        setForceRender(prev => prev + 1);
      }, 200);
    } else {
      console.log('📊 UnifiedTableView - onReorderItems 不存在');
    }
  };

  // Render the table header based on view type
  const renderTableHeader = () => {
    if (viewType === 'materials') {
      return (
        <div className={styles.tableHeader}>
          <span className={styles.columnHandle}></span>
          <span className={styles.columnNumber}>#</span>
          <span className={styles.columnType}>Type</span>
          <span className={styles.columnTitle}>Name</span>
          <span className={styles.columnActions}>{viewMode === 'list' ? 'Actions' : ''}</span>
        </div>
      );
    } else {
      return (
        <div className={styles.tableHeader}>
          <span className={styles.columnHandle}></span>
          <span className={styles.columnNumber}>#</span>
          <span className={styles.columnProgress}>
            <LuGoal className={styles.headerIcon} />
          </span>
          <span className={styles.columnType}>Type</span>
          <span className={styles.columnTitle}>Name</span>
          <span className={styles.columnProgressText}>{viewMode === 'list' ? 'To Finish' : ''}</span>
          <span className={styles.columnActions}>{viewMode === 'list' ? 'Link' : ''}</span>
        </div>
      );
    }
  };

  // Render a table row based on view type
  const renderTableRow = (material: Material & { type: keyof Categories; index: number }) => {
    const TypeIcon = TYPE_ICONS[material.type];
    
    if (viewType === 'materials') {
      return (
        <div className={styles.tableRow}>
          <span className={styles.columnHandle}>
            <DragHandle />
          </span>
          <span className={styles.columnNumber}>{material.index}</span>
          <span className={styles.columnType}>
            <TypeIcon className={styles.typeIcon} />
          </span>
          <span className={styles.columnTitleContent}>
            {material.url ? (
              <a href={material.url} target="_blank" rel="noopener noreferrer">
                {material.title}
              </a>
            ) : (
              material.title
            )}
          </span>
          <span className={styles.columnActions}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={styles.actionButton}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {onEdit && (
                  <DropdownMenuItem onSelect={() => onEdit(material)}>
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
          </span>
        </div>
      );
    } else {
      const totalUnits = estimateTimeUnits(material);
      const completedUnits = material.completedUnits || 0;
      const progress = completedUnits / totalUnits;

      return (
        <div className={styles.tableRow}>
          <span className={styles.columnHandle}>
            <DragHandle />
          </span>
          <span className={styles.columnNumber}>{material.index}</span>
          <span className={styles.columnProgress}>
            <CircleProgress progress={progress} />
          </span>
          <span className={styles.columnType}>
            <TypeIcon className={styles.typeIcon} />
          </span>
          <span className={styles.columnTitle}>
            <div className={styles.titleContainer}>
              <span className={styles.materialTitle}>
                {material.title ? 
                  (material.title.length > 60 ? `${material.title.slice(0, 60)}...` : material.title)
                  : 'Untitled'
                }
              </span>
              <div className={styles.unitsProgress}>
                {Array.from({ length: totalUnits }).map((_, i) => (
                  <div 
                    key={i}
                    className={`${styles.unitBlock} ${i < completedUnits ? styles.completed : ''}`}
                    onClick={() => handleUnitComplete(material, i)}
                  />
                ))}
              </div>
            </div>
          </span>
          <span className={styles.columnProgressText}>
            <div className={styles.editableUnits}>
              {editingUnitId === material._id ? (
                <>
                  {completedUnits}/
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalUnits}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      if (value > 0 && value <= 100 && onUpdateProgress) {
                        onUpdateProgress(material._id!, {
                          readingTime: value * (unitMinutes || 20)
                        });
                      }
                    }}
                    onBlur={() => setEditingUnitId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingUnitId(null);
                      }
                    }}
                    className={styles.inlineUnitsInput}
                    autoFocus
                  />
                </>
              ) : (
                <>
                  <span 
                    className={styles.editIcon} 
                    onClick={() => material._id && setEditingUnitId(material._id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.5 3.5L20.5 7.5L7 21H3V17L16.5 3.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {completedUnits}/{totalUnits}
                </>
              )}
              &nbsp;to finish
            </div>
          </span>
          <span className={styles.columnActions}>
            {material.url && (
              <Button 
                variant="ghost" 
                size="icon" 
                className={styles.playButton}
                onClick={() => window.open(material.url, '_blank')}
              >
                <FaPlay className="h-3 w-3" />
              </Button>
            )}
          </span>
        </div>
      );
    }
  };

  // Render the table based on view type and mode
  console.log('📊 UnifiedTableView - 渲染組件', { reorderCount, draggableListKey, materialsLength: localMaterials.length, forceRender });
  return (
    <div className={viewMode === 'list' ? styles.tableContainer : styles.gridContainer}>
      {viewMode === 'list' && renderTableHeader()}
      
      {viewType === 'studylist' && viewMode === 'list' && (
        <div className={styles.unitMinutesControl}>
          <label>Unit Minutes: {unitMinutes}</label>
          <input 
            type="range" 
            min="1" 
            max="60" 
            value={unitMinutes} 
            onChange={(e) => onUnitMinutesChange && onUnitMinutesChange(parseInt(e.target.value))} 
          />
        </div>
      )}
      
      {onReorderItems && (
        <div className={styles.restoreOrderButton}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRestoreOriginalOrder}
            className={styles.restoreButton}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore Original Order
          </Button>
        </div>
      )}
      
      <DraggableList
        key={`${viewType}-${draggableListKey}-${reorderCount}`}
        ref={draggableListRef}
        items={localMaterials}
        onReorder={handleReorderWithRefresh}
        droppableId={`${viewType}-list-${Date.now()}`}
        renderItem={(item, index) => renderTableRow(item)}
      />
    </div>
  );
}