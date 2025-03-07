import { useState, useEffect } from 'react';
import { Material, Categories, Contributions } from '../../types/User';
import styles from './StudyListView.module.css';
import { LuGlobe } from "react-icons/lu";
import { HiOutlineMicrophone } from "react-icons/hi";
import { FiBook, FiVideo } from "react-icons/fi";
import { FaCheck, FaTimes, FaPlay } from "react-icons/fa";
import CircleProgress from '../components/ui/circleProgress';
import VideoPopup from '../components/VideoPopup';
import UnifiedTableView from '../components/UnifiedTableView';

interface StudyListViewProps {
  materials: Material[];
  contributions?: Contributions;
  onCompleteMaterial: (materialId: string, isCompleted: boolean) => Promise<void>;
  unitMinutes: number;
  onUnitMinutesChange: (minutes: number) => void;
  topicId: string;
  onUpdateMaterial: (materialId: string, updates: Partial<Material>) => Promise<boolean>;
  onReorderMaterials?: (materials: Material[]) => Promise<void>;
}

export default function StudyListView({ 
  materials, 
  contributions,
  onCompleteMaterial,
  unitMinutes = 6,
  onUnitMinutesChange,
  topicId,
  onUpdateMaterial,
  onReorderMaterials
}: StudyListViewProps) {
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(() => {
    const completed = new Set<string>();
    
    materials.forEach(material => {
      if (material.completed && material._id) {
        completed.add(material._id);
      }
    });
    
    return completed;
  });
  
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
    
    materials.forEach(material => {
      if (material.completed && material._id) {
        completed.add(material._id);
      }
    });
    
    setCompletedMaterials(completed);
  }, [materials]);

  const typeIcons = {
    webpage: <LuGlobe size={20} />,
    video: <FiVideo size={20} />,
    podcast: <HiOutlineMicrophone size={20} />,
    book: <FiBook size={20} />
  };

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

  const getAllMaterials = () => {
    return materials.sort((a, b) => a.order - b.order);
  };

  const handleComplete = async (material: Material) => {
    if (!material._id) return;
    
    const isCompleted = completedMaterials.has(material._id);
    
    try {
      await onCompleteMaterial(material._id, isCompleted);
      
      // Update local state
      setCompletedMaterials(prev => {
        const newSet = new Set(prev);
        if (isCompleted) {
          newSet.delete(material._id!);
        } else {
          newSet.add(material._id!);
        }
        return newSet;
      });
    } catch (err) {
      console.error('Error updating completion status:', err);
    }
  };

  const handleUnitComplete = async (material: Material, clickedIndex: number) => {
    if (!material._id) return;
    
    const totalUnits = estimateTimeUnits(material);
    const currentCompleted = material.completedUnits || 0;
    
    // If clicking on a completed unit, mark it and all after it as incomplete
    if (clickedIndex < currentCompleted) {
      await onUpdateMaterial(material._id, {
        completedUnits: clickedIndex,
        completed: false
      });
    } 
    // If clicking on the last uncompleted unit, mark all as complete
    else if (clickedIndex === totalUnits - 1) {
      await onUpdateMaterial(material._id, {
        completedUnits: totalUnits,
        completed: true
      });
      
      // Add to completed set
      setCompletedMaterials(prev => {
        const newSet = new Set(prev);
        newSet.add(material._id!);
        return newSet;
      });
    } 
    // Otherwise mark up to the clicked unit as complete
    else {
      await onUpdateMaterial(material._id, {
        completedUnits: clickedIndex + 1,
        completed: false
      });
    }
  };

  const handleOpenContent = (material: Material) => {
    if (material.url) {
      window.open(material.url, '_blank');
    }
  };

  const handlePlayClick = (material: Material) => {
    if (material.url) {
      switch (material.type) {
        case 'video':
          // 打開視頻彈窗
          break;
        default:
          window.open(material.url, '_blank');
      }
    }
  };

  const handleReorderItems = async (reorderedItems: (Material & { index: number })[]) => {
    if (!onReorderMaterials) return;
    
    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    await onReorderMaterials(itemsWithOrder);
  };

  const materialsWithIndex = getAllMaterials().map((material, index) => ({
    ...material,
    index: index + 1
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {/* <h2 className={styles.title}>Study List</h2> */}
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
        <div className={styles.headerRight}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ 
                width: `${(completedMaterials.size / getAllMaterials().length) * 100}%` 
              }} 
            />
          </div>
        </div>
      </div>

      <UnifiedTableView
        key={`studylist-${topicId}-${Date.now()}`}
        materials={materialsWithIndex}
        viewType="studylist"
        onComplete={async (materialId, isCompleted) => {
          await onCompleteMaterial(materialId, isCompleted);
        }}
        onUpdateProgress={async (materialId, updates) => {
          return await onUpdateMaterial(materialId, updates);
        }}
        unitMinutes={unitMinutes}
        onReorderItems={onReorderMaterials ? handleReorderItems : undefined}
      />
      
      <VideoPopup 
        isOpen={contentPopup.isOpen}
        onClose={() => setContentPopup(prev => ({ ...prev, isOpen: false }))}
        url={contentPopup.url}
        title={contentPopup.title}
        unitMinutes={unitMinutes}
        showVideoContent={false}
      />
    </div>
  );
}
