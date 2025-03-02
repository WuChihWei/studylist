import { useState, useEffect } from 'react';
import { Material, Categories } from '../../types/User';
import styles from './StudyListView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaTimes, FaPlay } from "react-icons/fa";
import CircleProgress from './ui/circleProgress';
import VideoPopup from './VideoPopup';

interface StudyListViewProps {
  categories: Categories;
  onCompleteMaterial: (materialId: string, isCompleted: boolean) => Promise<void>;
  unitMinutes: number;
  onUnitMinutesChange: (minutes: number) => void;
  topicId: string;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
}

export default function StudyListView({ 
  categories, 
  onCompleteMaterial,
  unitMinutes = 6,
  onUnitMinutesChange,
  topicId,
  onUpdateMaterial
}: StudyListViewProps) {
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(() => {
    const completed = new Set<string>();
    
    if (categories.webpage) {
      categories.webpage.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.video) {
      categories.video.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.podcast) {
      categories.podcast.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.book) {
      categories.book.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    
    return completed;
  });
  
  // Add state for content popup
  const [contentPopup, setContentPopup] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
  }>({
    isOpen: false,
    url: '',
    title: ''
  });

  useEffect(() => {
    const completed = new Set<string>();
    
    if (categories.webpage) {
      categories.webpage.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.video) {
      categories.video.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.podcast) {
      categories.podcast.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    if (categories.book) {
      categories.book.forEach(material => {
        if (material.completed && material._id) {
          completed.add(material._id);
        }
      });
    }
    
    setCompletedMaterials(completed);
  }, [categories]);

  const typeIcons = {
    webpage: <LuGlobe size={20} />,
    video: <FiVideo size={20} />,
    podcast: <HiOutlineMicrophone size={20} />,
    book: <FiBook size={20} />
  };

  const estimateTimeUnits = (material: Material & { type: keyof Categories }) => {
    if (!material.readingTime) {
      return 6;
    }
    return Math.ceil(material.readingTime / unitMinutes);
  };

  const getAllMaterials = () => {
    const allMaterials = [
      ...categories.webpage.map(m => ({ ...m, type: 'webpage' as const })),
      ...categories.video.map(m => ({ ...m, type: 'video' as const })),
      ...categories.podcast.map(m => ({ ...m, type: 'podcast' as const })),
      ...categories.book.map(m => ({ ...m, type: 'book' as const }))
    ];

    return allMaterials.sort((a, b) => {
      const aCompleted = completedMaterials.has(a._id || '');
      const bCompleted = completedMaterials.has(b._id || '');
      if (aCompleted === bCompleted) return 0;
      return aCompleted ? 1 : -1;
    });
  };

  const handleComplete = async (material: Material) => {
    if (!material._id) return;
    
    const isCompleted = material.completed || false;
    console.log('7. Completing material:', {
      materialId: material._id,
      currentStatus: isCompleted,
      material: material
    });
    
    try {
      await onCompleteMaterial(material._id, isCompleted);
      console.log('Successfully called onCompleteMaterial');
      
      const newCompleted = new Set(completedMaterials);
      if (isCompleted) {
        newCompleted.delete(material._id);
      } else {
        newCompleted.add(material._id);
      }
      setCompletedMaterials(newCompleted);
      console.log('Updated local state:', {
        newCompletedSize: newCompleted.size,
        isCompleted
      });
    } catch (error) {
      console.error('Error in handleComplete:', error);
    }
  };

  const handleUnitComplete = async (material: Material & { type: keyof Categories }, clickedIndex: number) => {
    if (!material._id) return;
    
    console.log('1. Starting handleUnitComplete:', {
      materialId: material._id,
      clickedIndex,
      currentCompletedUnits: material.completedUnits
    });

    if (clickedIndex < (material.completedUnits || 0)) {
      console.log('2. Clicked on already completed unit, returning');
      return;
    }

    const newCompletedUnits = clickedIndex + 1;
    const totalUnits = estimateTimeUnits(material);
    
    console.log('3. Preparing update:', {
      newCompletedUnits,
      totalUnits,
      readingTime: totalUnits * unitMinutes
    });

    try {
      const success = await onUpdateMaterial(material._id, {
        completedUnits: newCompletedUnits,
        completed: newCompletedUnits === totalUnits,
        readingTime: totalUnits * unitMinutes
      });
      
      console.log('4. Update result:', { success });

      if (success) {
        const newCompleted = new Set(completedMaterials);
        if (newCompletedUnits === totalUnits) {
          newCompleted.add(material._id);
        } else {
          newCompleted.delete(material._id);
        }
        setCompletedMaterials(newCompleted);
        console.log('5. Local state updated:', {
          totalCompleted: newCompleted.size,
          isFullyCompleted: newCompletedUnits === totalUnits
        });
      }
    } catch (error) {
      console.error('6. Error updating units:', error);
    }
  };
  
  // Add function to open video popup
  const handleOpenContent = (material: Material & { type: keyof Categories }) => {
    if (!material.url) return;
    
    setContentPopup({
      isOpen: true,
      url: material.url,
      title: material.title || 'Untitled Content'
    });
  };

  return (
    <div className={styles.materialsContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span>All ({getAllMaterials().length})</span>
          <div className={styles.unitMinutesInput}>
            <input
              type="number"
              min="1"
              max="120"
              value={unitMinutes}
              placeholder="6"
              onChange={(e) => {
                const value = parseInt(e.target.value) || 6;
                if (value > 0 && value <= 120) {
                  onUnitMinutesChange(value);
                }
              }}
              className={styles.minutesInput}
            />
            <span>mins/unit</span>
          </div>
        </div>
        {/* <div className={styles.headerRight}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${(completedMaterials.size / getAllMaterials().length) * 100}%` 
              }} 
            />
          </div>
        </div> */}
      </div>

      <div className={styles.materialsList}>
        <div className={styles.materialsHeader}>
          <span>#</span>
          <span>Process</span>
          <span>Type</span>
          <span>Name</span>
          <span>Units</span>
          <span>Progress</span>
          <span>Action</span>
        </div>
        <div className={styles.materialsListContent}>
          {getAllMaterials().map((material, index) => {
            const totalUnits = estimateTimeUnits(material);
            const completedUnits = material.completedUnits || 0;
            const progress = completedUnits / totalUnits;

            return (
              <div 
                key={material._id || index} 
                className={styles.materialItem}
              >
                <span className={styles.materialNumber}>{index + 1}</span>
                <div className={styles.materialProgress}>
                  <CircleProgress progress={progress} />
                  <span>{`${completedUnits}/${totalUnits}`}</span>
                </div>
                <div className={styles.materialPreview}>
                  {typeIcons[material.type]}
                </div>
                <div className={styles.materialNameContainer}>
                  <span className={styles.materialName} title={material.title || ''}>
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
                <div className={styles.unitsEdit}>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalUnits}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      if (value > 0 && value <= 100) {
                        onUpdateMaterial(material._id!, {
                          readingTime: value * unitMinutes
                        });
                      }
                    }}
                    className={styles.unitsInput}
                  />
                  <span>units</span>
                </div>
                <div className={styles.progressText}>
                  {Math.round(progress * 100)}% Complete
                </div>
                <div className={styles.actionButtons}>
                  {material.url && (
                    <button 
                      className={styles.playButton}
                      onClick={() => handleOpenContent(material)}
                      title="Open Content"
                    >
                      <FaPlay size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Content Popup */}
      <VideoPopup 
        isOpen={contentPopup.isOpen}
        onClose={() => setContentPopup(prev => ({ ...prev, isOpen: false }))}
        url={contentPopup.url}
        title={contentPopup.title}
        unitMinutes={unitMinutes}
      />
    </div>
  );
}
