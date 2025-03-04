import React, { useState } from 'react';
import { Material, Categories } from '@/types/User';
import styles from './UnifiedTableView.module.css';
import { LuGlobe, LuGoal } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaPlay } from "react-icons/fa";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import CircleProgress from './ui/circleProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";

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
}

export default function UnifiedTableView({
  materials,
  viewType,
  viewMode = 'list',
  onEdit,
  onDelete,
  onComplete,
  onUpdateProgress,
  unitMinutes = 20
}: UnifiedTableViewProps) {
  
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  
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

  // Render the table header based on view type
  const renderTableHeader = () => {
    if (viewType === 'materials') {
      return (
        <div className={styles.tableHeader}>
          <span className={styles.columnNumber}>#</span>
          <span className={styles.columnType}>Type</span>
          <span className={styles.columnTitle}>Name</span>
          <span className={styles.columnActions}>{viewMode === 'list' ? 'Actions' : ''}</span>
        </div>
      );
    } else {
      return (
        <div className={styles.tableHeader}>
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
        <div key={material._id || material.index} className={styles.tableRow}>
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
        <div key={material._id || material.index} className={styles.tableRow}>
          <span className={styles.columnNumber}>{material.index}</span>
          <span className={styles.columnProgress}>
            <CircleProgress progress={progress} />
            {/* <span>{`${completedUnits}/${totalUnits}`}</span> */}
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
  return (
    <div className={styles.tableContainer}>
      {viewMode === 'list' ? (
        <>
          {renderTableHeader()}
          <div className={styles.tableBody}>
            {materials.map(material => renderTableRow(material))}
          </div>
        </>
      ) : (
        <div className={styles.gridContainer}>
          {(['webpage', 'video', 'podcast', 'book'] as const).map((type) => (
            <div key={type} className={styles.gridCategory}>
              <div className={styles.gridCategoryHeader}>
                <div className={styles.gridCategoryHeaderLeft}>
                  <span className={styles.columnNumber}>#</span>
                  <span className={styles.columnType}>Type</span>
                  <span className={styles.columnTitle}>Name</span>
                </div>
                <div className={styles.gridCategoryTitleContainer}>
                    <span className={styles.gridCategoryTitle}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    <span className={styles.gridCategoryCount}>
                    {materials.filter(m => m.type === type).length}
                    </span>
                </div>
               
              </div>
              <div className={styles.gridItems}>
                {materials
                  .filter(m => m.type === type)
                  .map(material => {
                    const TypeIcon = TYPE_ICONS[material.type];
                    return (
                      <div key={material._id || material.index} className={styles.gridItem}>
                        <div className={styles.gridItemHeader}>
                          <span className={styles.gridItemNumber}>{material.index}</span>
                          <span className={styles.columnType}>
                            <TypeIcon className={styles.typeIcon} />
                          </span>
                          <div className={styles.gridItemContent}>
                            <div className={styles.gridItemTitle}>
                              {material.url ? (
                                <a href={material.url} target="_blank" rel="noopener noreferrer">
                                  {material.title}
                                </a>
                              ) : (
                                material.title
                              )}
                            </div>
                          </div>
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
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}