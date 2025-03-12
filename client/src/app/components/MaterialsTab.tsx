import React, { useState, useEffect, useRef } from 'react';
import { Material } from '@/types/User';
import CircleProgress from './ui/circleProgress';
import { Play, Check } from 'lucide-react';
import { renderFavicon, TYPE_ICONS } from '@/utils/favicon';
import Timer from './ui/Timer';

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
  const [activeTimer, setActiveTimer] = useState<{
    materialId: string;
    minutes: number;
    nextUnit: number;
    material: Material;
  } | null>(null);
  
  // Force re-render state
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Local cache of materials with updated progress
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  
  // Track if we're in the middle of an update
  const updatingRef = useRef(false);
  
  // Initialize and update local materials when props change
  useEffect(() => {
    if (!updatingRef.current) {
      // Create a deep copy of materials to avoid reference issues
      const materialsCopy = materials.map(m => ({
        ...m,
        progress: m.progress ? { ...m.progress } : undefined
      }));
      
      // Merge with existing local materials to preserve our local updates
      if (localMaterials.length > 0) {
        const mergedMaterials = materialsCopy.map(incomingMaterial => {
          // Try to find this material in our local cache
          const existingMaterial = localMaterials.find(m => m._id === incomingMaterial._id);
          if (existingMaterial && existingMaterial.progress) {
            // If we have a local version with progress, use our progress value
            return {
              ...incomingMaterial,
              progress: existingMaterial.progress
            };
          }
          return incomingMaterial;
        });
        setLocalMaterials(mergedMaterials);
      } else {
        // First load, just use the incoming materials
        setLocalMaterials(materialsCopy);
      }
    }
  }, [materials]);
  
  // Force UI refresh
  const refreshUI = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Calculate material progress data - use local materials first, then fall back to props
  const getMaterialProgress = (material: Material) => {
    // Try to find the material in our local cache first
    const localMaterial = localMaterials.find(m => m._id === material._id);
    const materialToUse = localMaterial || material;
    
    const readingTime = materialToUse.readingTime || 10;
    const totalUnits = Math.ceil(readingTime / unitMinutes);
    const completedUnits = Math.ceil((materialToUse.progress?.completed || 0) / unitMinutes);
    const progress = (materialToUse.progress?.completed || 0) / readingTime;
    
    return {
      readingTime,
      totalUnits,
      completedUnits,
      progress: Math.min(progress, 1)
    };
  };

  // Enhanced onUpdateProgress with logging
  const handleProgressUpdate = async (id: string, completed: number, total: number) => {
    console.log('Calling API to update progress:', {
      id,
      completed,
      total
    });
    
    try {
      updatingRef.current = true;
      
      // Update our local cache immediately for responsive UI
      setLocalMaterials(prevMaterials => {
        return prevMaterials.map(m => {
          if (m._id === id) {
            return {
              ...m,
              progress: { completed, total }
            };
          }
          return m;
        });
      });
      
      // Force refresh UI immediately for visual feedback
      refreshUI();
      
      // Then make the API call
      const result = await onUpdateProgress(id, completed, total);
      console.log('API update result:', {
        success: result,
        id,
        completed,
        total
      });
      
      // If API call failed, revert our local change
      if (!result) {
        console.warn('API update failed, reverting local change');
        // Find the original material to get its original progress
        const originalMaterial = materials.find(m => m._id === id);
        if (originalMaterial) {
          setLocalMaterials(prevMaterials => {
            return prevMaterials.map(m => {
              if (m._id === id) {
                return {
                  ...m,
                  progress: originalMaterial.progress
                };
              }
              return m;
            });
          });
          refreshUI();
        }
      }
      
      updatingRef.current = false;
      return result;
    } catch (error) {
      console.error('API update error:', error);
      updatingRef.current = false;
      return false;
    }
  };

  // Handle unit click to update progress
  const handleUnitClick = async (material: Material, unitIndex: number) => {
    if (!material._id) {
      console.error('Material has no ID:', material);
      return false;
    }

    const { readingTime, totalUnits } = getMaterialProgress(material);
    
    // Calculate new completed time based on clicked unit
    const newCompletedTime = (unitIndex + 1) * unitMinutes;
    
    try {
      // Update progress
      const success = await handleProgressUpdate(
        material._id,
        newCompletedTime,
        readingTime
      );
      
      // If successful, update local state
      if (success) {
        // If all units completed, mark as done
        if (unitIndex + 1 === totalUnits) {
          await onComplete(material._id, true);
        }
      }

      return success;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  };

  // Handle opening content with timer
  const handleOpenWithTimer = (material: Material) => {
    if (!material._id || !material.url) return;

    // Open URL in new window
    window.open(material.url, '_blank');

    // Calculate next unit to complete
    const { completedUnits } = getMaterialProgress(material);

    // Set active timer with the actual unit time
    setActiveTimer({
      materialId: material._id,
      minutes: unitMinutes,
      nextUnit: completedUnits,
      material: material
    });
  };

  // Handle timer completion
  const handleTimerComplete = async () => {
    if (!activeTimer?.material) return;

    const material = activeTimer.material;
    const currentUnit = activeTimer.nextUnit;

    try {
      // Only update if not already completed
      const { completedUnits } = getMaterialProgress(material);
      if (currentUnit >= completedUnits) {
        const success = await handleUnitClick(material, currentUnit);
        if (!success) {
          console.error('Failed to update progress on timer completion');
          return;
        }
      }
    } catch (error) {
      console.error('Error during timer completion:', error);
    } finally {
      setActiveTimer(null);
    }
  };

  // Get material type icon
  const getMaterialTypeIcon = (type: string) => {
    const IconComponent = TYPE_ICONS[type] || TYPE_ICONS.webpage;
    return <IconComponent className="h-4 w-4" />;
  };

  // Use local materials for rendering rather than props directly
  const materialsToRender = localMaterials.length > 0 ? localMaterials : materials;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" key={refreshKey}>
      <Timer
        key={`${activeTimer?.materialId}-${activeTimer?.nextUnit}-${refreshKey}`}
        minutes={activeTimer?.minutes || 0}
        onComplete={handleTimerComplete}
        onClose={() => setActiveTimer(null)}
        isOpen={!!activeTimer}
        material={activeTimer?.material}
      />
      
      {/* Table headers */}
      <div className="grid grid-cols-12 bg-gray-50 text-gray-600 text-sm py-2 px-4 border-b">
        <div className="col-span-1">#</div>
        <div className="col-span-1">Progress</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-7">Name</div>
        <div className="col-span-1">Units</div>
        <div className="col-span-1">Link</div>
      </div>

      <div className="divide-y hide-scrollbar">
        {materialsToRender.map((material, index) => {
          const { totalUnits, completedUnits, progress } = getMaterialProgress(material);

          return (
            <div key={`${material._id || index}-${refreshKey}`} className="grid grid-cols-12 py-3 px-4 items-center hover:bg-gray-50">
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
              <div className="col-span-7">
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
                <div className="flex flex-col mt-2">
                  
                  <div className="flex gap-2 items-center">
                    {Array.from({ length: totalUnits }).map((_, i) => {
                      const isCompleted = i < completedUnits;
                      
                      return (
                        <button 
                          key={i}
                          type="button"
                          onClick={(e) => {
                            // Handle click
                            handleUnitClick(material, i);
                          }}
                          className={`
                            w-5 h-5 rounded flex items-center justify-center transition-colors
                            ${isCompleted 
                              ? 'bg-blue-500 text-white hover:bg-blue-600' 
                              : 'bg-gray-200 hover:bg-blue-400'
                            }
                          `}
                          title={isCompleted ? 'Completed' : 'Click to complete'}
                        >
                          {isCompleted && <Check className="h-3 w-3" />}
                        </button>
                      );
                    })}
                    
                  
                  </div>
                </div>
              </div>
              
              {/* Units edit */}
              <div className="col-span-1 flex items-center gap-1">
                <span className="text-gray-700 font-mono">
                  {completedUnits}/
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
                    className="w-8 p-0 border-none text-center font-mono bg-transparent"
                  />
                </span>
              </div>
              
              {/* Action buttons */}
              <div className="col-span-1 flex gap-2">
                {material.url && (
                  <button 
                    onClick={() => handleOpenWithTimer(material)}
                    className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                    title="Start Study Timer"
                  >
                    <Play className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MaterialsTab; 