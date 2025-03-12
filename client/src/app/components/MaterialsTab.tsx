import React from 'react';
import { Material } from '@/types/User';
import CircleProgress from './ui/circleProgress';
import { Play, Check } from 'lucide-react';
import { renderFavicon, TYPE_ICONS } from '@/utils/favicon';

interface MaterialsTabProps {
  materials: Material[];
  unitMinutes: number;
  onUpdateProgress: (id: string, completed: number, total: number) => Promise<boolean>;
  onComplete: (id: string, isCompleted: boolean) => Promise<void>;
  handleOpenContent: (material: Material) => void;
}

const MaterialsTab: React.FC<MaterialsTabProps> = ({
  materials,
  unitMinutes,
  onUpdateProgress,
  onComplete,
  handleOpenContent
}) => {
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

  // Get material type icon
  const getMaterialTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type] || TYPE_ICONS.webpage;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Table headers */}
      <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-sm py-2 px-4 border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-1">Progress</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Units</div>
        <div className="col-span-1">Completion</div>
        <div className="col-span-1">Actions</div>
      </div>

      <div className="divide-y hide-scrollbar">
        {materials.map((material, index) => {
          // Calculate progress-related data
          const readingTime = material.readingTime || 10;
          const totalUnits = Math.ceil(readingTime / unitMinutes);
          const completedUnits = Math.min(
            Math.ceil((material.progress?.completed || 0) / unitMinutes),
            totalUnits
          );
          const progress = totalUnits > 0 ? completedUnits / totalUnits : 0;
          const progressPercent = Math.round(progress * 100);

          return (
            <div key={material._id || index} className="grid grid-cols-12 py-3 px-4 items-center hover:bg-gray-50">
              {/* Index number */}
              <div className="col-span-1 font-medium text-gray-700">{index + 1}</div>
              
              {/* Progress circle */}
              <div className="col-span-1 flex items-center gap-1">
                <CircleProgress 
                  progress={progress} 
                  size={28} 
                  color={progress === 1 ? '#10B981' : '#4169E1'}
                />
              </div>
              
              {/* Type icon */}
              <div className="col-span-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600">
                  {getMaterialTypeIcon(material.type)}
                </div>
              </div>
              
              {/* Name */}
              <div className="col-span-5">
                <div className="flex items-center">
                  {renderFavicon(material)}
                  <div className="font-medium text-gray-800 hover:text-blue-600 truncate cursor-pointer" 
                       onClick={() => material.url && handleOpenContent(material)}>
                    {material.title}
                    {material.url && (
                      <span className="inline-block ml-1 text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Unit progress bar */}
                <div className="flex mt-2 gap-1">
                  {Array.from({ length: totalUnits }).map((_, i) => (
                    <div 
                      key={i}
                      onClick={() => handleUnitClick(material, i)}
                      className={`w-6 h-3 rounded cursor-pointer transition-colors ${
                        i < completedUnits 
                          ? 'bg-blue-500 hover:bg-blue-600' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Units edit */}
              <div className="col-span-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalUnits}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    if (value > 0 && value <= 100) {
                      onUpdateProgress(
                        material._id || '', 
                        material.progress?.completed || 0, 
                        value * unitMinutes
                      );
                    }
                  }}
                  className="w-16 p-1 border rounded text-center"
                />
                <span className="text-gray-500 text-sm">units</span>
              </div>
              
              {/* Completion percentage */}
              <div className="col-span-1 text-sm font-medium text-blue-600">
                {progressPercent}%
              </div>
              
              {/* Action buttons */}
              <div className="col-span-1 flex gap-2">
                {material.url && (
                  <button 
                    onClick={() => handleOpenContent(material)}
                    className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                    title="View Content"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}
                <button 
                  onClick={() => onComplete(material._id || '', !material.completed)}
                  className={`p-1 rounded-full ${material.completed ? 'bg-green-500' : 'bg-gray-200'} text-white hover:opacity-90`}
                  title={material.completed ? "Mark as incomplete" : "Mark as completed"}
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialsTab; 