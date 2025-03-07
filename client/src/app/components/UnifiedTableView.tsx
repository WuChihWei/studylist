import React, { useState, useRef, useEffect } from 'react';
import { Material } from '@/types/User';
import styles from './UnifiedTableView.module.css';
import { LuGlobe, LuGoal } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaPlay } from "react-icons/fa";
import { BiWorld } from "react-icons/bi";
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
import Image from 'next/image';

export const TYPE_ICONS = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

interface UnifiedTableViewProps {
  materials: (Material & { index: number })[];
  viewType: 'materials' | 'studylist';
  viewMode?: 'list' | 'grid';
  onEdit?: (material: Material) => void;
  onDelete?: (materialId: string) => Promise<boolean>;
  onComplete?: (materialId: string, isCompleted: boolean) => Promise<void>;
  onUpdateProgress?: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  unitMinutes?: number;
  onReorderItems?: (items: (Material & { index: number })[]) => void;
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
    setLocalMaterials(materials);
    materialsRef.current = materials;
    
    // Reset the draggableListKey when materials change to force a complete re-render
    setDraggableListKey(`draggable-list-${Date.now()}`);
  }, [materials]);

  useEffect(() => {
    if (reorderCount > 0) {
      setForceRender(prev => prev + 1);
    }
  }, [reorderCount]);

  useEffect(() => {
  }, [draggableListKey]);

  // 添加一個效果來處理強制渲染
  useEffect(() => {
    if (forceRender > 0) {
    }
  }, [forceRender]);

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

  const handleUnitComplete = async (material: Material, clickedIndex: number) => {
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
    if (draggableListRef.current) {
      draggableListRef.current.restoreOriginalOrder();
      setReorderCount(prev => {
        return prev + 1;
      });
      const newKey = `draggable-list-${Date.now()}`;
      setDraggableListKey(newKey);
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
        
        // 更新本地狀態
        setLocalMaterials(materialsWithUpdatedIndexes);
        
        // Call the parent component's reorder function
        if (onReorderItems) {
          onReorderItems(materialsWithUpdatedIndexes);
          
          // Force re-render of the DraggableList component
          const newKey = `draggable-list-${Date.now()}`;
          setDraggableListKey(newKey);
          
          // 增加計數器，強制UI刷新
          setReorderCount(prev => {
            return prev + 1;
          });
        }
      } catch (error) {
        alert('恢復原始順序失敗');
      }
    }
  };

  const handleReorderWithRefresh = (reorderedItems: (Material & { index: number })[]) => {
    // 確保所有項目都有正確的 order 屬性
    const itemsWithOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx // 確保 order 屬性與當前位置一致
    }));
    
    // 立即更新本地狀態
    setLocalMaterials(itemsWithOrder);
    materialsRef.current = itemsWithOrder;
    
    if (onReorderItems) {
      onReorderItems(itemsWithOrder);
      
      // 增加計數器，強制UI刷新
      setReorderCount(prev => {
        const newCount = prev + 1;
        return newCount;
      });
      
      // 更新DraggableList的key，強制其重新渲染
      const newKey = `draggable-list-${Date.now()}`;
      setDraggableListKey(newKey);
      
      // 延遲 100ms 後再次強制刷新
      setTimeout(() => {
        setForceRender(prev => prev + 1);
        
        // 再次更新DraggableList的key，確保其重新渲染
        const newerKey = `draggable-list-${Date.now()}`;
        setDraggableListKey(newerKey);
      }, 100);
    }
  };

  // Render the table header based on view type
  const renderTableHeader = () => {
    if (viewType === 'materials') {
      return (
        <div className={styles.tableHeader}>
          <span className={styles.columnHandle}></span>
          <span className={styles.columnNumber}>#</span>
          <span className={styles.columnNumber}>Icon</span>
          <span className={styles.columnTitle}>Name</span>
          <span className={styles.columnType}>Type</span>
          <span className={styles.columnActions}>{viewMode === 'list' ? 'Actions' : ''}</span>
        </div>
      );
    } else {
      return (
        <div className={styles.tableHeader}>
          <span className={styles.columnHandle}></span>
          <span className={styles.columnNumber}>#</span>
          <span className={styles.columnNumber}>Icon</span>
          <span className={styles.columnProgress}>
            <LuGoal className={styles.headerIcon} />
          </span>
          <span className={styles.columnTitle}>Name</span>
          <span className={styles.columnType}>Type</span>
          <span className={styles.columnProgressText}>{viewMode === 'list' ? 'To Finish' : ''}</span>
          <span className={styles.columnActions}>{viewMode === 'list' ? 'Link' : ''}</span>
        </div>
      );
    }
  };

  // Render a table row based on view type
  const renderTableRow = (material: Material & { index: number }) => {
    const TypeIcon = TYPE_ICONS[material.type];
    
    // 如果 material.favicon 是 undefined，則使用 Google Favicon 服務作為備用
    let favicon = material.favicon;
    if (!favicon && material.url) {
      try {
        const domain = new URL(material.url).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.log(`為 ${material.title} 生成默認 favicon:`, favicon);
        }
      } catch (e) {
        // 只在開發環境中輸出日誌
        if (process.env.NODE_ENV === 'development') {
          console.error(`無法為 ${material.title} 生成默認 favicon:`, e);
        }
      }
    }
    
    // 只在開發環境中輸出日誌，並且只在 favicon 存在時輸出
    if (process.env.NODE_ENV === 'development' && (material.favicon || favicon)) {
      console.log(`Material ${material.title} - favicon:`, material.favicon || favicon);
    }
    
    if (viewType === 'materials') {
      return (
        <div className={styles.tableRow}>
          <span className={styles.columnHandle}>
            <DragHandle />
          </span>
          <span className={styles.columnNumber}>{material.index}</span>
          <span className={styles.columnTitleContent}>
            <span className={styles.titleIconContainer}>
              {(material.favicon || favicon) ? (
                <img 
                  src={material.favicon || favicon} 
                  alt={`${material.title} favicon`} 
                  className={styles.favicon} 
                  onError={(e) => {
                    // 只在開發環境中輸出日誌
                    if (process.env.NODE_ENV === 'development') {
                      console.log(`Favicon load error for ${material.title}:`, e);
                      console.log(`Favicon URL: ${material.favicon || favicon}`);
                    }
                    
                    // 嘗試使用 Google Favicon 服務作為備用
                    try {
                      const domain = new URL(material.url || '').hostname;
                      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                      // 只在開發環境中輸出日誌
                      if (process.env.NODE_ENV === 'development') {
                        console.log(`使用 Google Favicon 服務作為備用: ${googleFavicon}`);
                      }
                      
                      // 創建一個新的圖片元素
                      const img = e.currentTarget;
                      img.src = googleFavicon;
                      
                      // 如果 Google Favicon 也加載失敗，則顯示默認圖標
                      img.onerror = () => {
                        // 只在開發環境中輸出日誌
                        if (process.env.NODE_ENV === 'development') {
                          console.log(`Google Favicon 也加載失敗: ${googleFavicon}`);
                        }
                        img.style.display = 'none';
                        const nextElement = img.nextElementSibling;
                        if (nextElement) {
                          nextElement.classList.remove(styles.hidden);
                        }
                      };
                    } catch (err) {
                      // 只在開發環境中輸出日誌
                      if (process.env.NODE_ENV === 'development') {
                        console.error('無法設置 Google Favicon:', err);
                      }
                      // If image fails to load, hide it and show the default icon
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling;
                      if (nextElement) {
                        nextElement.classList.remove(styles.hidden);
                      }
                    }
                  }}
                />
              ) : (
                <BiWorld className={styles.typeIcon} />
              )}
              {(material.favicon || favicon) && <BiWorld className={`${styles.typeIcon} ${styles.hidden}`} />}
            </span>
            {material.url ? (
              <a href={material.url} target="_blank" rel="noopener noreferrer">
                {material.title.length > 60 ? `${material.title.slice(0, 60)}...` : material.title}
              </a>
            ) : (
              material.title
            )}
          </span>
          <span className={styles.columnType}>
            <TypeIcon className={styles.typeIconRight} />
            {/* <span className={styles.typeText}>{material.type.charAt(0).toUpperCase() + material.type.slice(1)}</span> */}
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
          <span className={styles.columnTitleContent}>
            <span className={styles.titleIconContainer}>
              {(material.favicon || favicon) ? (
                <img 
                  src={material.favicon || favicon} 
                  alt={material.title} 
                  className={styles.favicon} 
                  onError={(e) => {
                    // 只在開發環境中輸出日誌
                    if (process.env.NODE_ENV === 'development') {
                      console.log(`Favicon load error for ${material.title}:`, e);
                      console.log(`Favicon URL: ${material.favicon || favicon}`);
                    }
                    
                    // 嘗試使用 Google Favicon 服務作為備用
                    try {
                      const domain = new URL(material.url || '').hostname;
                      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                      // 只在開發環境中輸出日誌
                      if (process.env.NODE_ENV === 'development') {
                        console.log(`使用 Google Favicon 服務作為備用: ${googleFavicon}`);
                      }
                      
                      // 創建一個新的圖片元素
                      const img = e.currentTarget;
                      img.src = googleFavicon;
                      
                      // 如果 Google Favicon 也加載失敗，則顯示默認圖標
                      img.onerror = () => {
                        // 只在開發環境中輸出日誌
                        if (process.env.NODE_ENV === 'development') {
                          console.log(`Google Favicon 也加載失敗: ${googleFavicon}`);
                        }
                        img.style.display = 'none';
                        const nextElement = img.nextElementSibling;
                        if (nextElement) {
                          nextElement.classList.remove(styles.hidden);
                        }
                      };
                    } catch (err) {
                      // 只在開發環境中輸出日誌
                      if (process.env.NODE_ENV === 'development') {
                        console.error('無法設置 Google Favicon:', err);
                      }
                      // If image fails to load, hide it and show the default icon
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling;
                      if (nextElement) {
                        nextElement.classList.remove(styles.hidden);
                      }
                    }
                  }}
                />
              ) : (
                <BiWorld className={styles.typeIcon} />
              )}
              {(material.favicon || favicon) && <BiWorld className={`${styles.typeIcon} ${styles.hidden}`} />}
            </span>
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
          <span className={styles.columnType}>
            <TypeIcon className={styles.typeIconRight} />
            <span className={styles.typeText}>{material.type.charAt(0).toUpperCase() + material.type.slice(1)}</span>
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
  return (
    <div className={viewMode === 'list' ? styles.tableContainer : styles.gridContainer}>
      {viewMode === 'list' && renderTableHeader()}
      
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