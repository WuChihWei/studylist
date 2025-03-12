import React, { useState } from 'react';
import { Material } from '@/types/User';
import { Play, Check, X, ArrowRight, Edit } from 'lucide-react';
import { TYPE_ICONS, renderFavicon } from '@/utils/favicon';

interface ProgressTabProps {
  materials: Material[];
  unitMinutes: number;
  onUpdateProgress: (id: string, completed: number, total: number) => Promise<boolean>;
  onComplete: (id: string, isCompleted: boolean) => Promise<void>;
  handleOpenContent: (material: Material) => void;
}

const ProgressTab: React.FC<ProgressTabProps> = ({
  materials,
  unitMinutes,
  onUpdateProgress,
  onComplete,
  handleOpenContent
}) => {
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Categorize materials based on progress
  const todoMaterials = materials.filter(m => !m.progress || m.progress.completed === 0);
  const doingMaterials = materials.filter(m => m.progress && m.progress.completed > 0 && m.progress.completed < m.progress.total);
  const doneMaterials = materials.filter(m => m.progress && m.progress.completed === m.progress.total);

  // Handle material status change
  const handleStatusChange = (material: Material, newStatus: 'todo' | 'doing' | 'done') => {
    if (!material._id) return;
    
    // Calculate new progress based on status
    switch (newStatus) {
      case 'todo':
        // Set progress to 0
        onUpdateProgress(material._id, 0, material.progress?.total || 10);
        if (material.completed) {
          onComplete(material._id, false);
        }
        break;
      case 'doing':
        // If previously not started or completed, set to halfway progress
        const total = material.progress?.total || 10;
        const halfProgress = Math.floor(total / 2);
        onUpdateProgress(material._id, halfProgress, total);
        if (material.completed) {
          onComplete(material._id, false);
        }
        break;
      case 'done':
        // Mark as completed
        onComplete(material._id, true);
        break;
    }
  };

  // Handle unit click to update progress
  const handleUnitClick = (material: Material, unitIndex: number) => {
    if (!material._id) return;

    const readingTime = material.readingTime || 10;
    const totalUnits = Math.ceil(readingTime / unitMinutes);
    
    // If clicked on already completed unit, do nothing
    const completedUnits = material.completedUnits || 0;
    if (unitIndex < completedUnits) return;
    
    // Calculate new completed units
    const newCompletedUnits = unitIndex + 1;
    
    // Update progress
    onUpdateProgress(
      material._id, 
      newCompletedUnits * unitMinutes, 
      readingTime
    );
    
    // If all units completed, mark as done
    if (newCompletedUnits === totalUnits) {
      onComplete(material._id, true);
    }
  };

  // 添加一个辅助函数来截断文本
  const truncateTitle = (title: string, maxLength: number = 15) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  // 创建可复用的渲染函数
  const renderSection = (title: string, sectionMaterials: Material[], status: 'todo' | 'doing' | 'done') => {
    return (
      <div className="bg-white border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium px-4 py-4 text-gray-600 flex items-center justify-between border-b">
          <span>{title}</span>
          <span className="text-xs text-gray-500">{sectionMaterials.length}</span>
        </h3>
        
        <div 
          className=" min-h-[200px] hide-scrollbar"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('bg-gray-50');
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-gray-50');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-gray-50');
            if (isDragging) {
              const material = materials.find(m => m._id === isDragging);
              if (material) {
                handleStatusChange(material, status);
              }
              setIsDragging(null);
            }
          }}
        >
          {sectionMaterials.length > 0 ? (
            sectionMaterials.map((material, index) => {
              const totalUnits = Math.ceil((material.readingTime || 10) / unitMinutes);
              const completedUnits = status === 'todo' 
                ? 0 
                : (material.completedUnits || Math.floor((material.progress?.completed || 0) / unitMinutes));
              const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;
              const progressPercent = status === 'done' 
                ? 100 
                : (status === 'doing' ? Math.round(progress * 100) : 0);
              
              return (
                <div 
                  key={material._id || index} 
                  className="border-b border-gray-200 group hover:bg-gray-50"
                  draggable
                  onDragStart={() => setIsDragging(material._id || null)}
                  onDragEnd={() => setIsDragging(null)}
                >
                  <div className="flex items-center gap-2 p-2">
                    {/* 左侧序号 */}
                    <div className="text-xs font-light text-gray-600 text-center">
                      {index + 1}
                    </div>
                    
                    {/* 圆形进度指示器 */}
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#e6e6e6" strokeWidth="3"></circle>
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          fill="none" 
                          stroke="#3674ff" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          strokeDasharray={`${progressPercent} 100`}
                          transform="rotate(-90 18 18)"
                        ></circle>
                      </svg>
                    </div>
                    
                    {/* Favicon */}
                    <div className="w-8 h-8 flex items-center justify-center">
                      {renderFavicon(material)}
                    </div>
                    
                    {/* 标题和进度指示 */}
                    <div className="flex justify-between w-full">
                      <div className="flex flex-col justify-between items-start w-full">
                          <div className="w-full">
                            <h6 className={`font-medium text-gray-800 group-hover:text-gray-900 truncate max-w-[90%] pr-2 ${status === 'done' ? 'line-through' : ''}`} title={material.title}>
                               {truncateTitle(material.title)}
                            </h6>            
                          </div>                    
                        <div className="flex gap-2">
                        {Array.from({ length: Math.min(8, totalUnits) }).map((_, i) => (
                          <div 
                            key={i}
                            onClick={status !== 'done' ? () => handleUnitClick(material, i) : undefined}
                            className={`w-4 h-4 rounded ${status !== 'done' ? 'cursor-pointer' : ''} transition-colors flex items-center justify-center ${
                              i < completedUnits || status === 'done'
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                          </div>
                        ))}
                        {totalUnits > 8 && (
                          <div className="w-4 h-4 flex items-center justify-center text-gray-400">
                            ...
                          </div>
                        )}
                      </div>
                      </div>
                      
                      {/* 进度点 */}
                      
                      <div className="flex flex-col items-center gap-2 flex-shrink-0 ml-auto">
                          <span className="text-gray-500 text-xs">
                            {status === 'todo' ? `0/${totalUnits}` : 
                             status === 'done' ? `${totalUnits}/${totalUnits}` : 
                             `${completedUnits}/${totalUnits}`}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>

                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-300 italic text-sm">
              <p>No {title.toLowerCase()} items</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderSection("To Do", todoMaterials, 'todo')}
      {renderSection("In Progress", doingMaterials, 'doing')}
      {renderSection("Completed", doneMaterials, 'done')}
    </div>
  );
};

export default ProgressTab; 